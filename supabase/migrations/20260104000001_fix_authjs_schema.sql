-- Fix: Move Auth.js tables to public schema
-- The @auth/supabase-adapter expects tables in the public schema

-- Drop existing RLS policies that reference user_id columns
-- We'll recreate them later with UUID support
DROP POLICY IF EXISTS "Users can query their solutions" ON public.solutions;
DROP POLICY IF EXISTS "Users can insert their solutions" ON public.solutions;
DROP POLICY IF EXISTS "Users can update their solutions" ON public.solutions;
DROP POLICY IF EXISTS "Users can delete their solutions" ON public.solutions;

DROP POLICY IF EXISTS "Users can query their plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can insert their plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can update their plan" ON public.user_plans;

DROP POLICY IF EXISTS "Users can insert their usage events" ON public.ai_usage_events;
DROP POLICY IF EXISTS "Users can select their usage events" ON public.ai_usage_events;

-- Convert user_id columns from TEXT to UUID
-- Clear data if conversion fails (Clerk user IDs can't be converted)
DO $$
BEGIN
  -- Try converting solutions
  BEGIN
    ALTER TABLE public.solutions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Clearing solutions table to allow UUID conversion...';
    TRUNCATE TABLE public.solutions CASCADE;
    ALTER TABLE public.solutions ALTER COLUMN user_id TYPE UUID USING NULL::uuid;
  END;

  -- Try converting user_plans
  BEGIN
    ALTER TABLE public.user_plans ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Clearing user_plans table to allow UUID conversion...';
    TRUNCATE TABLE public.user_plans CASCADE;
    ALTER TABLE public.user_plans ALTER COLUMN user_id TYPE UUID USING NULL::uuid;
  END;

  -- Try converting ai_usage_events
  BEGIN
    ALTER TABLE public.ai_usage_events ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Clearing ai_usage_events table to allow UUID conversion...';
    TRUNCATE TABLE public.ai_usage_events CASCADE;
    ALTER TABLE public.ai_usage_events ALTER COLUMN user_id TYPE UUID USING NULL::uuid;
  END;
END $$;

-- Drop the next_auth schema tables (keeping the function)
DROP TABLE IF EXISTS next_auth.verification_tokens CASCADE;
DROP TABLE IF EXISTS next_auth.accounts CASCADE;
DROP TABLE IF EXISTS next_auth.sessions CASCADE;
DROP TABLE IF EXISTS next_auth.users CASCADE;

-- Create tables in public schema with the correct names for the adapter
CREATE TABLE IF NOT EXISTS public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    "emailVerified" TIMESTAMPTZ,
    image TEXT,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.users TO service_role;

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken")
);

GRANT ALL ON TABLE public.sessions TO postgres;
GRANT ALL ON TABLE public.sessions TO service_role;

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId")
);

GRANT ALL ON TABLE public.accounts TO postgres;
GRANT ALL ON TABLE public.accounts TO service_role;

CREATE TABLE IF NOT EXISTS public.verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);

GRANT ALL ON TABLE public.verification_tokens TO postgres;
GRANT ALL ON TABLE public.verification_tokens TO service_role;

-- Update the next_auth.uid() function to return UUID (not TEXT)
-- Must use CASCADE because RLS policies depend on it
DROP FUNCTION IF EXISTS next_auth.uid() CASCADE;

CREATE OR REPLACE FUNCTION next_auth.uid()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

GRANT EXECUTE ON FUNCTION next_auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO service_role;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO anon;

COMMENT ON FUNCTION next_auth.uid() IS 'Returns the user ID (UUID) from the JWT sub claim for use in RLS policies';

-- Recreate RLS policies for solutions table (dropped by CASCADE)
CREATE POLICY "Users can query their solutions"
ON public.solutions
FOR SELECT
TO authenticated
USING (next_auth.uid() = user_id);

CREATE POLICY "Users can insert their solutions"
ON public.solutions
FOR INSERT
TO authenticated
WITH CHECK (next_auth.uid() = user_id);

CREATE POLICY "Users can update their solutions"
ON public.solutions
FOR UPDATE
TO authenticated
USING (next_auth.uid() = user_id)
WITH CHECK (next_auth.uid() = user_id);

CREATE POLICY "Users can delete their solutions"
ON public.solutions
FOR DELETE
TO authenticated
USING (next_auth.uid() = user_id);

-- Recreate RLS policies for user_plans table (dropped by CASCADE)
CREATE POLICY "Users can query their plan"
ON public.user_plans
FOR SELECT
TO authenticated
USING (next_auth.uid() = user_id);

CREATE POLICY "Users can insert their plan"
ON public.user_plans
FOR INSERT
TO authenticated
WITH CHECK (next_auth.uid() = user_id);

CREATE POLICY "Users can update their plan"
ON public.user_plans
FOR UPDATE
TO authenticated
USING (next_auth.uid() = user_id)
WITH CHECK (next_auth.uid() = user_id);

-- Recreate RLS policies for ai_usage_events table (dropped by CASCADE)
CREATE POLICY "Users can insert their usage events"
ON public.ai_usage_events
FOR INSERT
TO authenticated
WITH CHECK (next_auth.uid() = user_id);

CREATE POLICY "Users can select their usage events"
ON public.ai_usage_events
FOR SELECT
TO authenticated
USING (next_auth.uid() = user_id);

