import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    isAdmin?: boolean;
  }

  interface Session {
    supabaseAccessToken?: string;
    user: {
      id: string;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }
}
