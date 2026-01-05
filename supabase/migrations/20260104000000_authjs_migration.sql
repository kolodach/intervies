-- Migration: Clerk to Auth.js (NextAuth v5)
-- This migration:
-- 1. Creates the next_auth schema for Auth.js tables
-- 2. Creates the next_auth.uid() function for RLS policies
-- 3. Updates all RLS policies to use next_auth.uid()

-- ============================================================================
-- 1. CREATE NEXT_AUTH SCHEMA AND TABLES
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Create next_auth.users table
CREATE TABLE IF NOT EXISTS next_auth.users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    "emailVerified" TIMESTAMPTZ,
    image TEXT,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

-- Create next_auth.sessions table
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken")
);

GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

-- Create next_auth.accounts table
CREATE TABLE IF NOT EXISTS next_auth.accounts (
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
    "userId" UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId")
);

GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

-- Create next_auth.verification_tokens table
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);

GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- ============================================================================
-- 2. CREATE NEXT_AUTH.UID() FUNCTION
-- ============================================================================
-- This function extracts the user ID from the JWT 'sub' claim
-- Used by RLS policies to check ownership

CREATE OR REPLACE FUNCTION next_auth.uid()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::text
$$;

GRANT EXECUTE ON FUNCTION next_auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION next_auth.uid() TO service_role;

COMMENT ON FUNCTION next_auth.uid() IS 'Returns the user ID from the JWT sub claim for use in RLS policies';

-- ============================================================================
-- 3. UPDATE RLS POLICIES FOR SOLUTIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can query their solutions" ON public.solutions;
DROP POLICY IF EXISTS "Users can insert their solutions" ON public.solutions;
DROP POLICY IF EXISTS "Users can update their solutions" ON public.solutions;
DROP POLICY IF EXISTS "Users can delete their solutions" ON public.solutions;

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

-- ============================================================================
-- 4. UPDATE RLS POLICIES FOR USER_PLANS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can query their plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can insert their plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can update their plan" ON public.user_plans;

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

-- ============================================================================
-- 5. UPDATE RLS POLICIES FOR AI_USAGE_EVENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their usage events" ON public.ai_usage_events;
DROP POLICY IF EXISTS "Users can select their usage events" ON public.ai_usage_events;

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

-- ============================================================================
-- 6. UPDATE SUPABASE CONFIG TO EXPOSE NEXT_AUTH SCHEMA
-- ============================================================================
-- Note: You also need to update supabase/config.toml to add "next_auth" to schemas:
-- [api]
-- schemas = ["public", "graphql_public", "next_auth"]

