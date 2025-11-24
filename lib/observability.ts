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
