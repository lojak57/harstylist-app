-- Function to directly confirm a user's email in auth.users table
-- This should be executed with service role permissions
CREATE OR REPLACE FUNCTION auth.confirm_user_email(user_email TEXT)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = now(),
      updated_at = now(),
      confirmation_sent_at = COALESCE(confirmation_sent_at, now())
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql;
