-- Add the validate_client_code function for client portal registration

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

-- Update the create_client_for_registration function to use client codes
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_client_code TO authenticated;

-- Generate client codes for existing clients that don't have one
UPDATE clients
SET client_code = LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE client_code IS NULL OR client_code = '';
