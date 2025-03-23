-- SQL to fix the user's aud and role values
-- This needs to be run in the Supabase SQL Editor

-- Update the user to have proper aud and role values
UPDATE auth.users
SET 
  aud = 'authenticated',
  role = 'authenticated',
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  updated_at = now()
WHERE email = 'newtest@example.com'
RETURNING email, aud, role;

-- Check user details again to make sure everything is set correctly
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  banned_until,
  aud,
  role,
  raw_app_meta_data
FROM auth.users
WHERE email = 'newtest@example.com';
