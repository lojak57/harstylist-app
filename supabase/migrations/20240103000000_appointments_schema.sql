-- Create appointments table
create table if not exists public.appointments (
    id uuid default gen_random_uuid() primary key,
    stylist_id uuid references auth.users(id) on delete cascade,
    client_id uuid references public.clients(id) on delete cascade,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    service_type text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies for appointments
alter table public.appointments enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Stylists can view their own appointments" on public.appointments;
drop policy if exists "Stylists can insert their own appointments" on public.appointments;
drop policy if exists "Stylists can update their own appointments" on public.appointments;
drop policy if exists "Stylists can delete their own appointments" on public.appointments;

-- Create new policies
create policy "Stylists can view their own appointments"
    on public.appointments for select
    using (auth.uid() = stylist_id);

create policy "Stylists can insert their own appointments"
    on public.appointments for insert
    with check (auth.uid() = stylist_id);

create policy "Stylists can update their own appointments"
    on public.appointments for update
    using (auth.uid() = stylist_id);

create policy "Stylists can delete their own appointments"
    on public.appointments for delete
    using (auth.uid() = stylist_id);

-- Add indexes for better query performance
create index if not exists appointments_stylist_id_idx on public.appointments(stylist_id);
create index if not exists appointments_client_id_idx on public.appointments(client_id);
create index if not exists appointments_start_time_idx on public.appointments(start_time);