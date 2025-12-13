-- Create sales_calls table for calendar functionality
CREATE TABLE IF NOT EXISTS public.sales_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_sales_calls_user_id ON public.sales_calls(user_id);
CREATE INDEX idx_sales_calls_contact_id ON public.sales_calls(contact_id);
CREATE INDEX idx_sales_calls_scheduled_at ON public.sales_calls(scheduled_at);
CREATE INDEX idx_sales_calls_status ON public.sales_calls(status);

-- Enable RLS
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own sales calls
CREATE POLICY "Users can view own sales calls" ON public.sales_calls
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own sales calls
CREATE POLICY "Users can insert own sales calls" ON public.sales_calls
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sales calls
CREATE POLICY "Users can update own sales calls" ON public.sales_calls
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sales calls
CREATE POLICY "Users can delete own sales calls" ON public.sales_calls
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_sales_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_calls_updated_at
    BEFORE UPDATE ON public.sales_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_calls_updated_at();

