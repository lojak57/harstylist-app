-- SQL to reset password for the specific user we found
-- This needs to be run in the Supabase SQL Editor

-- Reset password for newtest@example.com
UPDATE auth.users
SET 
  encrypted_password = crypt('newpassword123', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now()
WHERE email = 'newtest@example.com'
RETURNING email;

-- Check user details to make sure everything is set correctly
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  banned_until,
  aud,
  role
FROM auth.users
WHERE email = 'newtest@example.com';
