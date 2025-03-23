-- Script to directly confirm a user's email in Supabase
-- Run this in the Supabase SQL Editor

-- Replace with the actual email if different
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'mitch.mechelay57@icloud.com';

-- Verify the update worked
SELECT id, email, email_confirmed_at, updated_at
FROM auth.users
WHERE email = 'mitch.mechelay57@icloud.com';
