-- Add recommended_products column to style_guides table
alter table public.style_guides
    add column if not exists recommended_products text[];

-- Create index for recommended_products column to improve query performance
create index if not exists style_guides_recommended_products_idx on public.style_guides using gin(recommended_products);