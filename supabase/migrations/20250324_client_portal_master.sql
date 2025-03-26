-- Master Client Portal SQL Migration
-- Combines functionality from multiple migration files
-- Date: 2025-03-24

-- 1. Add required columns to clients table
--    (From add-client-portal-columns.sql)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS client_code TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add unique constraint to client_code
ALTER TABLE clients
ADD CONSTRAINT IF NOT EXISTS client_code_unique UNIQUE (client_code);

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- 2. Client Registration Functions
--    (From apply_client_registration_changes.sql and 20250323_client_registration_functions.sql)

-- Function to create a client record for registration
CREATE OR REPLACE FUNCTION public.create_client_for_registration(
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  stylist_id_param UUID,
  client_code_param TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  client_id_var UUID;
  client_exists BOOLEAN;
BEGIN
  -- Check if there is a client with this code under this stylist
  SELECT id, EXISTS(
    SELECT 1 
    FROM clients 
    WHERE client_code = client_code_param 
    AND stylist_id = stylist_id_param
  ) INTO client_id_var, client_exists 
  FROM clients 
  WHERE client_code = client_code_param 
  AND stylist_id = stylist_id_param
  LIMIT 1;
  
  IF NOT client_exists THEN
    RAISE EXCEPTION 'Invalid client code or stylist combination';
  END IF;
  
  -- Update the existing client record with the new information
  UPDATE clients
  SET 
    name = COALESCE(client_name, name),
    email = COALESCE(client_email, email),
    phone = COALESCE(client_phone, phone),
    updated_at = now()
  WHERE id = client_id_var;
  
  RETURN client_id_var;
END;
$$;

-- Function to link a client record to a user account
CREATE OR REPLACE FUNCTION public.link_client_to_user(
  client_id_param UUID,
  user_id_param UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run with the privileges of the function creator
SET search_path = public
AS $$
BEGIN
  -- Update the client record with the user_id
  UPDATE clients
  SET user_id = user_id_param,
      -- Generate a unique client code if one doesn't exist yet
      client_code = COALESCE(client_code, LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))),
      updated_at = now()
  WHERE id = client_id_param;
  
  -- Also store the client ID in the user's metadata for easier lookup
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('client_id', client_id_param::TEXT)
  WHERE id = user_id_param;
END;
$$;

-- 3. Client Code Validation Function
--    (From 20250501_client_code_validation.sql)

-- Function to validate a client code against a stylist
CREATE OR REPLACE FUNCTION public.validate_client_code(
  code_param TEXT,
  stylist_id_param UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  client_exists BOOLEAN;
BEGIN
  -- Check if there is a client with this code under this stylist
  SELECT EXISTS(
    SELECT 1 
    FROM clients 
    WHERE client_code = code_param 
    AND stylist_id = stylist_id_param
    AND user_id IS NULL -- Ensure the client is not already registered
  ) INTO client_exists;
  
  RETURN client_exists;
END;
$$;

-- 4. Grant Permissions and Set RLS Policies
--    (Combined from multiple files)

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_client_for_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_client_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_client_code TO authenticated;

-- Make sure RLS is enabled on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Stylists can view their own clients" ON clients;
DROP POLICY IF EXISTS "Stylists can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Stylists can update their own clients" ON clients;
DROP POLICY IF EXISTS "Clients can view their own data" ON clients;
DROP POLICY IF EXISTS "Clients can update their own data" ON clients;
DROP POLICY IF EXISTS "Stylists can update client_code" ON clients;

-- Policy for stylists to manage their clients
CREATE POLICY "Stylists can view their own clients"
ON clients
FOR SELECT
TO authenticated
USING (stylist_id = auth.uid());

CREATE POLICY "Stylists can insert their own clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (stylist_id = auth.uid());

CREATE POLICY "Stylists can update their own clients"
ON clients
FOR UPDATE
TO authenticated
USING (stylist_id = auth.uid());

-- Policy for clients to view and update their own data
CREATE POLICY "Clients can view their own data"
ON clients
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Clients can update their own data"
ON clients
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Generate client codes for existing clients that don't have one
UPDATE clients
SET client_code = LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE client_code IS NULL OR client_code = '';
