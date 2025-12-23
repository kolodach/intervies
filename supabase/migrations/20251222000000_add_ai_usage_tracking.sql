-- AI Usage Tracking Migration
-- This migration adds tables to track AI usage and pricing for plan limit monitoring

-- 1. Create entity_type_enum for flexible usage tracking
CREATE TYPE entity_type_enum AS ENUM ('solution', 'evaluation');

-- 2. Create ai_pricing table with versioning support via state field
CREATE TABLE ai_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'archived')),
  input_price_per_token NUMERIC(10,8) NOT NULL,
  output_price_per_token NUMERIC(10,8) NOT NULL,
  cached_input_price_per_token NUMERIC(10,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique index to ensure only one active price per model
CREATE UNIQUE INDEX idx_ai_pricing_model_active 
ON ai_pricing (model, state) 
WHERE state = 'active';

-- Create index for historical lookups
CREATE INDEX idx_ai_pricing_model ON ai_pricing(model);

-- Enable Row Level Security (RLS)
ALTER TABLE ai_pricing ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role can read all pricing"
ON public.ai_pricing
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert pricing"
ON public.ai_pricing
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update pricing"
ON public.ai_pricing
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_ai_pricing_updated_at
  BEFORE UPDATE ON ai_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Create ai_usage_events table (matches AI SDK LanguageModelV2Usage, excludes reasoning tokens as they're not billed)
CREATE TABLE ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  entity_type entity_type_enum NOT NULL,
  entity_id UUID NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  cached_input_tokens INTEGER NOT NULL DEFAULT 0 CHECK (cached_input_tokens >= 0),
  price_id UUID NOT NULL REFERENCES ai_pricing(id) ON DELETE RESTRICT,
  total_cost_usd NUMERIC(10,8) NOT NULL CHECK (total_cost_usd >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indices for efficient queries
CREATE INDEX idx_ai_usage_events_user_id ON ai_usage_events(user_id);
CREATE INDEX idx_ai_usage_events_entity ON ai_usage_events(entity_type, entity_id);
CREATE INDEX idx_ai_usage_events_timestamp ON ai_usage_events(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own usage events
CREATE POLICY "Users can insert their usage events"
ON public.ai_usage_events
FOR INSERT
TO authenticated
WITH CHECK (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Policy: Users can select their own usage events
CREATE POLICY "Users can select their usage events"
ON public.ai_usage_events
FOR SELECT
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Policy: Service role has full access
CREATE POLICY "Service role can read all usage events"
ON public.ai_usage_events
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert usage events"
ON public.ai_usage_events
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update usage events"
ON public.ai_usage_events
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE ai_pricing IS 'Stores AI model pricing with versioning support via state field';
COMMENT ON COLUMN ai_pricing.state IS 'State of pricing: active (current) or archived (historical)';
COMMENT ON COLUMN ai_pricing.input_price_per_token IS 'Price per input token in USD';
COMMENT ON COLUMN ai_pricing.output_price_per_token IS 'Price per output token in USD';
COMMENT ON COLUMN ai_pricing.cached_input_price_per_token IS 'Price per cached input token in USD (prompt cache hits)';

COMMENT ON TABLE ai_usage_events IS 'Tracks AI usage events per user for plan limit monitoring. Tracks only billable tokens from AI SDK LanguageModelV2Usage';
COMMENT ON COLUMN ai_usage_events.entity_type IS 'Type of entity: solution, evaluation, etc.';
COMMENT ON COLUMN ai_usage_events.entity_id IS 'UUID of the entity (solution_id, evaluation_id, etc.)';
COMMENT ON COLUMN ai_usage_events.input_tokens IS 'Number of input (prompt) tokens used';
COMMENT ON COLUMN ai_usage_events.output_tokens IS 'Number of output (completion) tokens used';
COMMENT ON COLUMN ai_usage_events.cached_input_tokens IS 'Number of cached input tokens (prompt cache hits)';
COMMENT ON COLUMN ai_usage_events.total_cost_usd IS 'Calculated total cost in USD for this usage event';

-- 4. Seed AI model pricing data
-- Prices converted from per-million to per-token rates
-- cached_input_price_per_token corresponds to "Cache Read" price from AI Gateway
INSERT INTO ai_pricing (model, state, input_price_per_token, output_price_per_token, cached_input_price_per_token) VALUES
  ('anthropic/claude-sonnet-4.5', 'active', 0.000003, 0.000015, 0.0000003),
  ('openai/gpt-4.1-mini', 'active', 0.0000004, 0.0000016, 0.0000001);

