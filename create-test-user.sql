-- SQL to create a test user with a known password
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
  'test@example.com',
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
) ON CONFLICT (id) DO NOTHING;

-- Then, create a corresponding entry in the public.stylists table
INSERT INTO public.stylists (id, email, name, created_at)
SELECT 
  id,
  email,
  'Test Stylist',
  created_at
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO NOTHING;
