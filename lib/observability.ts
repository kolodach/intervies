import * as Sentry from "@sentry/nextjs";

export function captureNewUser() {
  Sentry.metrics.count("new_user", 1);
}

export function captureUserLogin() {
  Sentry.metrics.count("user_login", 1);
}

export function captureWebhookHit(webhook: string) {
  Sentry.metrics.count(`webhook_hit_${webhook}`, 1);
}

export function captureError(error: Error) {
  Sentry.captureException(error);
}

export function captureEvaluationSuccess(durationMs: number) {
  Sentry.metrics.count("evaluation_success", 1);
  Sentry.metrics.gauge("evaluation_duration_ms", durationMs);
}

export function captureEvaluationFailure() {
  Sentry.metrics.count("evaluation_failure", 1);
}

// Subscription business metrics
export function captureSubscriptionCreated() {
  Sentry.metrics.count("subscription_created", 1);
}

export function captureSubscriptionRenewed() {
  Sentry.metrics.count("subscription_renewed", 1);
}

export function captureSubscriptionCanceled() {
  Sentry.metrics.count("subscription_canceled", 1);
}

export function capturePaymentFailed() {
  Sentry.metrics.count("payment_failed", 1);
}

// AI Usage metrics
export function captureAICost(costUsd: number) {
  Sentry.metrics.gauge("ai_cost_usd", costUsd);
}

// Paywall and usage limit metrics
export function capturePaywallShown() {
  Sentry.metrics.count("paywall_shown", 1);
}

export function captureUsageLimitReached() {
  Sentry.metrics.count("usage_limit_reached", 1);
}

export function captureBlockedChatAttempt(reason: string) {
  Sentry.metrics.count("blocked_chat_attempt", 1);
  Sentry.metrics.count(`blocked_chat_attempt_${reason.toLowerCase()}`, 1);
}
