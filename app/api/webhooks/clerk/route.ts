import { captureNewUser, captureUserLogin } from "@/lib/observability";
import { createWebhooksHandler } from "@brianmmdev/clerk-webhooks-handler";
import * as Sentry from "@sentry/nextjs";

const handler = createWebhooksHandler({
  onUserCreated: async (payload) => {
    Sentry.metrics.count("new_user", 1);
  },

  onSessionCreated: async (payload) => {
    Sentry.metrics.count("user_login", 1);
  },
});

export const POST = handler.POST;
