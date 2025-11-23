import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Use dynamic imports to avoid bundling test files
    try {
      await require("pino");
      await require("next-logger");
    } catch (error) {
      // Ignore import errors during build
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to load pino/next-logger:", error);
      }
    }
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
