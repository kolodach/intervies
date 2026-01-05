"use client";

import type { Database } from "@/lib/database.types";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

export function useSupabaseBrowserClient() {
  const { data: session } = useSession();

  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }

    return createClient<Database>(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${session?.supabaseAccessToken ?? ""}`,
        },
      },
    });
  }, [session?.supabaseAccessToken]);

  return client;
}
