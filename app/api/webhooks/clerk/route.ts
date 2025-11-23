import { captureNewUser, captureUserLogin } from "@/lib/observability";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { createWebhooksHandler } from "@brianmmdev/clerk-webhooks-handler";
import * as Sentry from "@sentry/nextjs";

const handler = createWebhooksHandler({
  onUserCreated: async (payload) => {
    try {
      const supabase = createServiceRoleSupabaseClient();

      // Sync user to Supabase auth.users table using Admin API
      const { data: user, error } = await supabase.auth.admin.createUser({
        id: payload.id,
        email: payload.email_addresses?.[0]?.email_address ?? undefined,
        email_confirm: true,
        user_metadata: {
          first_name: payload.first_name ?? null,
          last_name: payload.last_name ?? null,
          avatar_url: payload.image_url ?? null,
          clerk_created_at: payload.created_at,
          clerk_updated_at: payload.updated_at,
        },
      });

      if (error) {
        Sentry.captureException(error, {
          tags: { webhook: "user.created", operation: "user_sync" },
          extra: { user_id: payload.id, error_message: error.message },
        });
        throw error;
      }

      // Capture metrics
      captureNewUser();
      Sentry.metrics.count("user_synced_created", 1);

      await Sentry.flush();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { webhook: "user.created", operation: "user_sync" },
      });
      Sentry.metrics.count("user_sync_error_created", 1);
      await Sentry.flush();
      throw error;
    }
  },

  onUserUpdated: async (payload) => {
    try {
      const supabase = createServiceRoleSupabaseClient();

      // Update user in Supabase auth.users table using Admin API
      const { data: user, error } = await supabase.auth.admin.updateUserById(
        payload.id,
        {
          email: payload.email_addresses?.[0]?.email_address ?? undefined,
          user_metadata: {
            first_name: payload.first_name ?? null,
            last_name: payload.last_name ?? null,
            avatar_url: payload.image_url ?? null,
            clerk_updated_at: payload.updated_at,
          },
        }
      );

      if (error) {
        Sentry.captureException(error, {
          tags: { webhook: "user.updated", operation: "user_sync" },
          extra: { user_id: payload.id, error_message: error.message },
        });
        throw error;
      }

      // Capture metrics
      Sentry.metrics.count("user_synced_updated", 1);

      await Sentry.flush();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { webhook: "user.updated", operation: "user_sync" },
      });
      Sentry.metrics.count("user_sync_error_updated", 1);
      await Sentry.flush();
      throw error;
    }
  },

  onUserDeleted: async (payload) => {
    try {
      const userId = payload.id;
      if (!userId) {
        throw new Error("User ID is missing from deletion payload");
      }

      const supabase = createServiceRoleSupabaseClient();

      // Delete user from Supabase auth.users table using Admin API
      const { data, error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        Sentry.captureException(error, {
          tags: { webhook: "user.deleted", operation: "user_deletion" },
          extra: { user_id: userId, error_message: error.message },
        });
        throw error;
      }

      // Capture metrics
      Sentry.metrics.count("user_deleted", 1);

      await Sentry.flush();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { webhook: "user.deleted", operation: "user_deletion" },
      });
      Sentry.metrics.count("user_deletion_error", 1);
      await Sentry.flush();
      throw error;
    }
  },

  onSessionCreated: async (payload) => {
    captureUserLogin();
    await Sentry.flush();
  },
});

export const POST = handler.POST;
