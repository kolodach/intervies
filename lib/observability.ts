import * as Sentry from "@sentry/nextjs";

export function captureNewUser() {
  Sentry.metrics.count("new_user", 1);
}

export function captureUserLogin() {
  Sentry.metrics.count("user_login", 1);
}
