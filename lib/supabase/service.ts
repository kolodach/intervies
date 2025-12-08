import type { Database } from "@/lib/database.types";
import { logger } from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service role key for server-side operations
 * that need to bypass Row Level Security (e.g., webhooks)
 */
export function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  logger.info(
    `Creating service role client: ${supabaseUrl} with service role key: ${supabaseServiceKey}`
  );

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase URL and Service Role Key must be configured for service role client"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}
