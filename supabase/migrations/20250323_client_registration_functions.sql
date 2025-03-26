-- Function to create a client record for registration
-- This will be executed with the service role to bypass RLS
CREATE OR REPLACE FUNCTION public.create_client_for_registration(
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  stylist_id_param UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  new_client_id UUID;
BEGIN
  -- Insert the new client record
  INSERT INTO clients (
    name,
    email,
    phone,
    stylist_id,
    created_at
  ) VALUES (
    client_name,
    client_email,
    client_phone,
    stylist_id_param,
    now()
  )
  RETURNING id INTO new_client_id;
  
  RETURN new_client_id;
END;
$$;

-- Function to link a client record to a user account
-- This will be executed with the service role to bypass RLS
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
  SET user_id = user_id_param
  WHERE id = client_id_param;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_client_for_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_client_to_user TO authenticated;

-- Add RLS policies for client access
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

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
