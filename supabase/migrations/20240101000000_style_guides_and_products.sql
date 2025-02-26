-- Create style_guides table
create table if not exists public.style_guides (
    id uuid default gen_random_uuid() primary key,
    stylist_id uuid references auth.users(id) on delete cascade,
    name text not null,
    description text,
    steps text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table if not exists public.products (
    id uuid default gen_random_uuid() primary key,
    stylist_id uuid references auth.users(id) on delete cascade,
    name text not null,
    description text,
    link text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create client_style_guides junction table
create table if not exists public.client_style_guides (
    client_id uuid references public.clients(id) on delete cascade,
    style_guide_id uuid references public.style_guides(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (client_id, style_guide_id)
);

-- Create client_products junction table
create table if not exists public.client_products (
    client_id uuid references public.clients(id) on delete cascade,
    product_id uuid references public.products(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (client_id, product_id)
);

-- Add RLS policies
alter table public.style_guides enable row level security;
alter table public.products enable row level security;
alter table public.client_style_guides enable row level security;
alter table public.client_products enable row level security;

-- Drop existing style guides policies if they exist
drop policy if exists "Stylists can view their own style guides" on public.style_guides;
drop policy if exists "Stylists can insert their own style guides" on public.style_guides;
drop policy if exists "Stylists can update their own style guides" on public.style_guides;
drop policy if exists "Stylists can delete their own style guides" on public.style_guides;

-- Drop existing products policies if they exist
drop policy if exists "Stylists can view their own products" on public.products;
drop policy if exists "Stylists can insert their own products" on public.products;
drop policy if exists "Stylists can update their own products" on public.products;
drop policy if exists "Stylists can delete their own products" on public.products;

-- Drop existing junction table policies if they exist
drop policy if exists "Stylists can view their clients' style guides" on public.client_style_guides;
drop policy if exists "Stylists can manage their clients' style guides" on public.client_style_guides;
drop policy if exists "Stylists can view their clients' products" on public.client_products;
drop policy if exists "Stylists can manage their clients' products" on public.client_products;

-- Style guides policies
create policy "Stylists can view their own style guides"
    on public.style_guides for select
    using (auth.uid() = stylist_id);

create policy "Stylists can insert their own style guides"
    on public.style_guides for insert
    with check (auth.uid() = stylist_id);

create policy "Stylists can update their own style guides"
    on public.style_guides for update
    using (auth.uid() = stylist_id);

create policy "Stylists can delete their own style guides"
    on public.style_guides for delete
    using (auth.uid() = stylist_id);

-- Products policies
create policy "Stylists can view their own products"
    on public.products for select
    using (auth.uid() = stylist_id);

create policy "Stylists can insert their own products"
    on public.products for insert
    with check (auth.uid() = stylist_id);

create policy "Stylists can update their own products"
    on public.products for update
    using (auth.uid() = stylist_id);

create policy "Stylists can delete their own products"
    on public.products for delete
    using (auth.uid() = stylist_id);

-- Client style guides junction policies
create policy "Stylists can view their clients' style guides"
    on public.client_style_guides for select
    using (exists (
        select 1 from public.clients
        where clients.id = client_style_guides.client_id
        and clients.stylist_id = auth.uid()
    ));

create policy "Stylists can manage their clients' style guides"
    on public.client_style_guides for all
    using (exists (
        select 1 from public.clients
        where clients.id = client_style_guides.client_id
        and clients.stylist_id = auth.uid()
    ));

-- Client products junction policies
create policy "Stylists can view their clients' products"
    on public.client_products for select
    using (exists (
        select 1 from public.clients
        where clients.id = client_products.client_id
        and clients.stylist_id = auth.uid()
    ));

create policy "Stylists can manage their clients' products"
    on public.client_products for all
    using (exists (
        select 1 from public.clients
        where clients.id = client_products.client_id
        and clients.stylist_id = auth.uid()
    ));