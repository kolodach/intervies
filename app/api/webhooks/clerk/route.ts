import { captureNewUser, captureUserLogin } from "@/lib/observability";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { createWebhooksHandler } from "@brianmmdev/clerk-webhooks-handler";
import * as Sentry from "@sentry/nextjs";

/**
 * Find Supabase user ID by Clerk ID stored in user_metadata
 */
async function findUserByClerkId(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  clerkId: string
): Promise<string | null> {
  // Query auth.users via RPC function to find user by clerk_id in metadata
  // RPC function not in database types, so we use type assertion
  const { data, error } = await (
    supabase.rpc as unknown as (
      name: string,
      args: { clerk_id: string }
    ) => Promise<{ data: string | null; error: unknown }>
  )("find_user_by_clerk_id", {
    clerk_id: clerkId,
  });

  if (error || !data) {
    return null;
  }

  return data;
}

const handler = createWebhooksHandler({
  onUserCreated: async (payload) => {
    try {
      const supabase = createServiceRoleSupabaseClient();

      // Sync user to Supabase auth.users table using Admin API
      // Let Supabase generate its own user ID, store Clerk ID in metadata
      const { data: user, error } = await supabase.auth.admin.createUser({
        email: payload.email_addresses?.[0]?.email_address ?? undefined,
        email_confirm: true,
        user_metadata: {
          clerk_id: payload.id,
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

      // Find Supabase user ID by Clerk ID
      const supabaseUserId = await findUserByClerkId(supabase, payload.id);

      if (!supabaseUserId) {
        const error = new Error(
          `User not found in Supabase for Clerk ID: ${payload.id}`
        );
        Sentry.captureException(error, {
          tags: {
            webhook: "user.updated",
            operation: "user_sync",
            error_type: "user_not_found",
          },
          extra: {
            clerk_id: payload.id,
            email: payload.email_addresses?.[0]?.email_address,
          },
        });
        Sentry.metrics.count("user_update_not_found", 1);
        await Sentry.flush();
        throw error;
      }

      // Update user in Supabase auth.users table using Admin API
      const { data: user, error } = await supabase.auth.admin.updateUserById(
        supabaseUserId,
        {
          email: payload.email_addresses?.[0]?.email_address ?? undefined,
          user_metadata: {
            clerk_id: payload.id,
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
          extra: {
            clerk_id: payload.id,
            supabase_user_id: supabaseUserId,
            error_message: error.message,
          },
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
      const clerkId = payload.id;
      if (!clerkId) {
        throw new Error("Clerk ID is missing from deletion payload");
      }

      const supabase = createServiceRoleSupabaseClient();

      // Find Supabase user ID by Clerk ID
      const supabaseUserId = await findUserByClerkId(supabase, clerkId);

      if (!supabaseUserId) {
        // User might not exist in Supabase, log but don't fail
        Sentry.captureMessage(
          `User not found in Supabase for deletion, Clerk ID: ${clerkId}`,
          {
            level: "warning",
            tags: {
              webhook: "user.deleted",
              operation: "user_deletion",
              error_type: "user_not_found",
            },
            extra: {
              clerk_id: clerkId,
            },
          }
        );
        Sentry.metrics.count("user_deletion_not_found", 1);
        await Sentry.flush();
        return;
      }

      // Delete user from Supabase auth.users table using Admin API
      const { data, error } = await supabase.auth.admin.deleteUser(
        supabaseUserId
      );

      if (error) {
        Sentry.captureException(error, {
          tags: { webhook: "user.deleted", operation: "user_deletion" },
          extra: {
            clerk_id: clerkId,
            supabase_user_id: supabaseUserId,
            error_message: error.message,
          },
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
