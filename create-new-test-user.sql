-- SQL to create a brand new test user with a different email
-- This needs to be run in the Supabase SQL Editor

-- First, create a user in the auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'newtest@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Get the ID of the newly created user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'newtest@example.com';
  
  -- Create a corresponding entry in the public.stylists table
  INSERT INTO public.stylists (id, email, name, created_at)
  VALUES (
    new_user_id,
    'newtest@example.com',
    'New Test Stylist',
    now()
  );
END
$$;
