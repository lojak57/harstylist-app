-- SQL to reset the password for an existing user
-- This needs to be run in the Supabase SQL Editor

-- Reset password to 'password123'
UPDATE auth.users
SET encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'test@example.com';

-- Ensure email is confirmed
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'test@example.com' AND email_confirmed_at IS NULL;

-- Check if the user exists in the stylists table, add if not
INSERT INTO public.stylists (id, email, name, created_at)
SELECT 
  id,
  email,
  'Test Stylist',
  created_at
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO NOTHING;
