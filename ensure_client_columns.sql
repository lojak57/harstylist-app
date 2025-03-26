-- Ensure necessary columns exist for client registration and profile
DO $$
BEGIN
    -- Check if user_id column exists in clients table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'user_id'
    ) THEN
        -- Add the user_id column
        ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Check if client_code column exists in clients table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'client_code'
    ) THEN
        -- Add the client_code column
        ALTER TABLE clients ADD COLUMN client_code TEXT UNIQUE;
    END IF;
END
$$;
