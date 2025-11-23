-- Create a function to find Supabase user ID by Clerk ID stored in user_metadata
-- This function queries auth.users table which requires service role permissions
CREATE OR REPLACE FUNCTION find_user_by_clerk_id(clerk_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id TEXT;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE raw_user_meta_data->>'clerk_id' = clerk_id
  LIMIT 1;
  
  RETURN user_id;
END;
$$;

