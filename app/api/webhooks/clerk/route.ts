import { captureNewUser, captureUserLogin } from "@/lib/observability";
import { createWebhooksHandler } from "@brianmmdev/clerk-webhooks-handler";
import * as Sentry from "@sentry/nextjs";

const handler = createWebhooksHandler({
  onUserCreated: async (payload) => {
    captureNewUser();
    await Sentry.flush();
  },

  onSessionCreated: async (payload) => {
    captureUserLogin();
    await Sentry.flush();
  },
});

export const POST = handler.POST;
