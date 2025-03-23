-- Function to confirm a user's email
-- This needs to be run in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.confirm_user(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Update the email_confirmed_at timestamp to confirm the user
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
