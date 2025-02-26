-- Create services table
create table if not exists public.services (
    id uuid default gen_random_uuid() primary key,
    stylist_id uuid references auth.users(id) on delete cascade,
    name text not null,
    category text not null, -- 'men', 'women', or 'both'
    description text,
    duration interval,
    price numeric(10,2) not null default 0.00,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create client_services junction table
create table if not exists public.client_services (
    client_id uuid references public.clients(id) on delete cascade,
    service_id uuid references public.services(id) on delete cascade,
    primary key (client_id, service_id)
);

-- Add RLS policies for services
alter table public.services enable row level security;

create policy "Stylists can view their own services"
    on public.services for select
    using (auth.uid() = stylist_id);

create policy "Stylists can insert their own services"
    on public.services for insert
    with check (auth.uid() = stylist_id);

create policy "Stylists can update their own services"
    on public.services for update
    using (auth.uid() = stylist_id);

create policy "Stylists can delete their own services"
    on public.services for delete
    using (auth.uid() = stylist_id);

-- Add RLS policies for client_services
alter table public.client_services enable row level security;

create policy "Stylists can view their clients' services"
    on public.client_services for select
    using (exists (
        select 1 from public.clients
        where clients.id = client_services.client_id
        and clients.stylist_id = auth.uid()
    ));

create policy "Stylists can manage their clients' services"
    on public.client_services for all
    using (exists (
        select 1 from public.clients
        where clients.id = client_services.client_id
        and clients.stylist_id = auth.uid()
    ));

-- Note: Default services should be inserted through the application when a stylist signs up
-- This ensures proper association with the stylist's ID