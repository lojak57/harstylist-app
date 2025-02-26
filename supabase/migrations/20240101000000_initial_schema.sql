-- Create clients table with UUID support
create table if not exists public.clients (
    id uuid default gen_random_uuid() primary key,
    stylist_id uuid references auth.users(id) on delete cascade,
    name text not null,
    email text,
    phone text,
    hair_type text,
    notes text,
    style_guide text,
    preferred_products text,
    last_visit timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies for clients
alter table public.clients enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Stylists can view their own clients" on public.clients;
drop policy if exists "Stylists can insert their own clients" on public.clients;
drop policy if exists "Stylists can update their own clients" on public.clients;
drop policy if exists "Stylists can delete their own clients" on public.clients;

-- Create new policies
create policy "Stylists can view their own clients"
    on public.clients for select
    using (auth.uid() = stylist_id);

create policy "Stylists can insert their own clients"
    on public.clients for insert
    with check (auth.uid() = stylist_id);

create policy "Stylists can update their own clients"
    on public.clients for update
    using (auth.uid() = stylist_id);

create policy "Stylists can delete their own clients"
    on public.clients for delete
    using (auth.uid() = stylist_id);