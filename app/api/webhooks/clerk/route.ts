import { captureNewUser, captureUserLogin } from "@/lib/observability";
import { createWebhooksHandler } from "@brianmmdev/clerk-webhooks-handler";
import * as Sentry from "@sentry/nextjs";

const handler = createWebhooksHandler({
  onUserCreated: async (payload) => {
    Sentry.logger.info("Webbhook received", {
      event: "user.created",
      userId: payload.id,
    });
    try {
      Sentry.metrics.count("new_user", 1);
      Sentry.logger.info("Metric recorder", {
        metric: "new_user",
      });
      await Sentry.flush();
    } catch (error) {
      Sentry.captureException(error);
    }
  },

  onSessionCreated: async (payload) => {
    Sentry.logger.info("Webbhook received", {
      event: "session.created",
      userId: payload.id,
    });
    try {
      Sentry.metrics.count("user_login", 1);
      Sentry.logger.info("Metric recorder", {
        metric: "user_login",
      });
      await Sentry.flush();
    } catch (error) {
      Sentry.captureException(error);
    }
  },
});

export const POST = handler.POST;
