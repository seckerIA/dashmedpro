-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'dono', 'vendedor', 'gestor_trafego');

-- Create profiles table to store user profile data and roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'vendedor',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create table for team invitations
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role user_role NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, accepted_at) -- Prevent duplicate active invitations
);

-- Enable RLS on team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id AND role = _role AND is_active = true
  );
$$;

-- Create function to check if user is admin or dono
CREATE OR REPLACE FUNCTION public.is_admin_or_dono(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id AND role IN ('admin', 'dono') AND is_active = true
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admin and Dono can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin_or_dono(auth.uid()));

CREATE POLICY "Admin and Dono can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin_or_dono(auth.uid()));

CREATE POLICY "Admin and Dono can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_dono(auth.uid()));

-- RLS Policies for team_invitations
CREATE POLICY "Admin and Dono can manage invitations"
ON public.team_invitations FOR ALL
TO authenticated
USING (public.is_admin_or_dono(auth.uid()));

-- Function to handle new user registration from invitation
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record team_invitations%ROWTYPE;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT * INTO invitation_record
  FROM public.team_invitations
  WHERE email = NEW.email 
    AND accepted_at IS NULL 
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invitation_record.id IS NOT NULL THEN
    -- Create profile with role from invitation
    INSERT INTO public.profiles (id, email, role, invited_by, full_name)
    VALUES (
      NEW.id, 
      NEW.email, 
      invitation_record.role, 
      invitation_record.invited_by,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    
    -- Mark invitation as accepted
    UPDATE public.team_invitations 
    SET accepted_at = NOW() 
    WHERE id = invitation_record.id;
  ELSE
    -- Default profile creation (for admin signup)
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
      NEW.id, 
      NEW.email, 
      CASE 
        WHEN NEW.email = 'filipesenna59@gmail.com' THEN 'admin'::user_role
        ELSE 'vendedor'::user_role
      END,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_invitation();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();