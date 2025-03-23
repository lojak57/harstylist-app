-- SQL to check the status of the test user
-- This needs to be run in the Supabase SQL Editor

-- Check user status
SELECT 
  id,
  email,
  confirmed_at,
  email_confirmed_at,
  last_sign_in_at,
  banned_until,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
WHERE email = 'test@example.com';
