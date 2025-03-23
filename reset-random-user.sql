-- SQL to find a random existing user and reset their password
-- This needs to be run in the Supabase SQL Editor

-- First, let's see what users exist in the system
SELECT email FROM auth.users LIMIT 10;

-- Reset password for a specific user (replace with an email from the results above)
-- For example, if you see 'newtest@example.com' in the results:
UPDATE auth.users
SET 
  encrypted_password = crypt('newpassword123', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now()
WHERE email = 'newtest@example.com'
RETURNING email;

-- Alternatively, reset the first user in the system (if you don't want to manually select one)
/*
DO $$
DECLARE
  target_email text;
BEGIN
  -- Get the first user's email
  SELECT email INTO target_email FROM auth.users LIMIT 1;
  
  -- Reset that user's password
  UPDATE auth.users
  SET 
    encrypted_password = crypt('newpassword123', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now()
  WHERE email = target_email;
  
  -- Output the email that was updated
  RAISE NOTICE 'Reset password for user: %', target_email;
END
$$;
*/

-- Check if the user has a corresponding entry in the stylists table
SELECT * FROM public.stylists WHERE email = 'newtest@example.com';

-- If no results from above query, create the stylist entry
/*
INSERT INTO public.stylists (id, email, name, created_at)
SELECT 
  id,
  email,
  'Test Stylist',
  created_at
FROM auth.users
WHERE email = 'newtest@example.com'
ON CONFLICT (id) DO NOTHING;
*/
