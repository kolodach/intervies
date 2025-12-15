-- Schema for user_plans table (Stripe subscription data)
-- Stores Stripe customer and subscription information per user
-- Uses user_id TEXT to store Clerk user ID (matching other tables pattern)

CREATE TABLE user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'none',
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_method_brand TEXT,
  payment_method_last4 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX idx_user_plans_stripe_customer_id ON user_plans(stripe_customer_id);
CREATE INDEX idx_user_plans_status ON user_plans(status);

-- Enable Row Level Security (RLS)
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can query their own plan
CREATE POLICY "Users can query their plan"
ON public.user_plans
FOR SELECT
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Policy: Users can insert their own plan
CREATE POLICY "Users can insert their plan"
ON public.user_plans
FOR INSERT
TO authenticated
WITH CHECK (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Policy: Users can update their own plan
CREATE POLICY "Users can update their plan"
ON public.user_plans
FOR UPDATE
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
)
WITH CHECK (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Service role bypass for webhooks (SELECT)
CREATE POLICY "Service role can read all plans"
ON public.user_plans
FOR SELECT
TO service_role
USING (true);

-- Service role bypass for webhooks (UPDATE)
CREATE POLICY "Service role can update all plans"
ON public.user_plans
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Service role bypass for webhooks (INSERT)
CREATE POLICY "Service role can insert plans"
ON public.user_plans
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create updated_at trigger (reuse existing function if it exists)
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
