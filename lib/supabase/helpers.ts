import { createServiceRoleSupabaseClient } from "./service";

/**
 * Find Supabase user ID by Clerk ID stored in user_metadata
 * Uses type assertion due to RPC function typing issues
 */
export async function findUserByClerkId(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  clerkId: string
): Promise<string | null> {
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
