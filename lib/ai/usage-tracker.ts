import type { LanguageModelUsage } from "ai";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";
import { captureAICost, captureError } from "@/lib/observability";

interface TrackAIUsageParams {
  model: string;
  userId: string;
  usage: LanguageModelUsage;
  entityType: "solution" | "evaluation";
  entityId: string;
}

/**
 * Tracks AI usage by calculating cost and storing event in database.
 * This function is designed to never throw - errors are logged but don't break the main flow.
 *
 * @param model - Model identifier (e.g., "anthropic/claude-sonnet-4.5")
 * @param userId - Clerk user ID
 * @param usage - Usage object from AI SDK (LanguageModelUsage)
 * @param entityType - Type of entity ('solution' or 'evaluation')
 * @param entityId - Entity ID (typically solutionId)
 */
export async function trackAIUsage({
  model,
  userId,
  usage,
  entityType,
  entityId,
}: TrackAIUsageParams): Promise<void> {
  try {
    // Validate inputs
    if (!usage || (!usage.inputTokens && !usage.outputTokens)) {
      logger.warn(
        { model, userId, entityId, usage },
        "Skipping AI usage tracking - no token usage data"
      );
      return;
    }

    // Extract token counts with defaults
    const inputTokens = usage.inputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;
    const cachedInputTokens = usage.cachedInputTokens ?? 0;

    logger.info(
      {
        model,
        userId,
        entityType,
        entityId,
        inputTokens,
        outputTokens,
        cachedInputTokens,
      },
      "Tracking AI usage"
    );

    // Get service role client for database operations
    const supabase = createServiceRoleSupabaseClient();

    // Fetch active pricing for the model
    const { data: pricing, error: pricingError } = await supabase
      .from("ai_pricing")
      .select("*")
      .eq("model", model)
      .eq("state", "active")
      .single();

    if (pricingError || !pricing) {
      logger.warn(
        { model, pricingError },
        "No active pricing found for model - skipping usage tracking"
      );
      return;
    }

    // Calculate total cost
    const cost =
      inputTokens * Number(pricing.input_price_per_token) +
      outputTokens * Number(pricing.output_price_per_token) +
      cachedInputTokens * Number(pricing.cached_input_price_per_token);

    logger.info(
      {
        model,
        userId,
        entityId,
        cost: cost.toFixed(8),
        breakdown: {
          input: (inputTokens * Number(pricing.input_price_per_token)).toFixed(
            8
          ),
          output: (
            outputTokens * Number(pricing.output_price_per_token)
          ).toFixed(8),
          cached: (
            cachedInputTokens * Number(pricing.cached_input_price_per_token)
          ).toFixed(8),
        },
      },
      "Calculated AI usage cost"
    );

    // Insert usage event
    const { error: insertError } = await supabase
      .from("ai_usage_events")
      .insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cached_input_tokens: cachedInputTokens,
        price_id: pricing.id,
        total_cost_usd: cost,
      });

    if (insertError) {
      logger.error(
        { insertError, model, userId, entityId },
        "Failed to insert AI usage event"
      );
      captureError(
        new Error(`Failed to insert AI usage event: ${insertError.message}`)
      );
      return;
    }

    // Report cost metric to Sentry
    captureAICost(cost);

    logger.info(
      {
        model,
        userId,
        entityId,
        cost: cost.toFixed(8),
        tokens: {
          input: inputTokens,
          output: outputTokens,
          cached: cachedInputTokens,
        },
      },
      "AI usage tracked successfully"
    );
  } catch (error) {
    // Catch-all to ensure tracking failures never break the main flow
    logger.error(
      { error, model, userId, entityId },
      "Unexpected error tracking AI usage"
    );
    captureError(error as Error);
  }
}
