-- Add status column to appointments table
alter table public.appointments
    add column if not exists status text not null default 'scheduled';

-- Drop existing constraint if it exists
alter table public.appointments
    drop constraint if exists appointments_status_check;

-- Add check constraint to ensure valid status values
alter table public.appointments
    add constraint appointments_status_check
    check (status in ('scheduled', 'completed', 'cancelled'));

-- Create index for status column to improve query performance
create index if not exists appointments_status_idx on public.appointments(status);