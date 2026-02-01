-- Create table for doctor working hours
create table if not exists public.doctor_working_hours (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday, 6=Saturday
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint valid_time_range check (start_time < end_time)
);

-- RLS Policies
alter table public.doctor_working_hours enable row level security;

-- Policy for reading: everyone authenticated can read (simplifies AI access)
create policy "Authenticated users can view working hours"
  on public.doctor_working_hours for select
  to authenticated
  using (true);

-- Policy for inserting/updating: users can manage their own hours or admins/owners
create policy "Users can manage their own working hours"
  on public.doctor_working_hours for all
  to authenticated
  using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'dono', 'secretaria')
    )
  );
