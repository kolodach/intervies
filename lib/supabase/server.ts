import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";

export async function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      async accessToken() {
        const token = (await auth()).getToken();
        return token;
      },
    }
  );
}
