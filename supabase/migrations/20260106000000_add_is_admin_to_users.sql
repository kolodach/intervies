-- Add is_admin column to users table for admin access control
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Comment on the column
COMMENT ON COLUMN public.users.is_admin IS 'Flag indicating whether the user has admin privileges';

-- Update this with your admin email after running the migration
-- UPDATE public.users SET is_admin = true WHERE email = 'your-email@example.com';

