import { captureNewUser, captureUserLogin } from "@/lib/observability";
import { createWebhooksHandler } from "@brianmmdev/clerk-webhooks-handler";

const handler = createWebhooksHandler({
  onUserCreated: async (payload) => {
    captureNewUser();
  },
  onSessionCreated: async (payload) => {
    captureUserLogin();
  },
});

export const POST = handler.POST;
