"use client";

import type { Database } from "@/lib/database.types";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

export function useSupabaseBrowserClient() {
  const { data: session } = useSession();

  const client = useMemo(() => {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session?.supabaseAccessToken ?? ""}`,
          },
        },
      }
    );
  }, [session?.supabaseAccessToken]);

  return client;
}
