-- Add created_at column to users table for tracking signups
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW ();

-- Backfill existing users: use the earliest account creation or current time
-- Since accounts don't have created_at either, we'll just use NOW() for existing users
UPDATE users
SET
    created_at = NOW ()
WHERE
    created_at IS NULL;

-- Make it not null after backfill
ALTER TABLE users
ALTER COLUMN created_at
SET
    NOT NULL;