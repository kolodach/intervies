import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { CustomSupabaseAdapter } from "./custom-supabase-adapter";
import * as jose from "jose";
import { createServiceRoleSupabaseClient } from "./supabase/service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  providers: [Google],
  adapter: CustomSupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }),
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async session({ session, user }) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      if (!signingSecret) {
        console.error(
          "SUPABASE_JWT_SECRET is missing - sessions will not work with RLS"
        );
        throw new Error("SUPABASE_JWT_SECRET is required");
      }

      // Fetch is_admin status from database
      const supabase = createServiceRoleSupabaseClient();
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      const isAdmin = userData?.is_admin ?? false;

      const payload = {
        aud: "authenticated",
        exp: Math.floor(new Date(session.expires).getTime() / 1000),
        sub: user.id,
        email: user.email,
        role: "authenticated",
        is_admin: isAdmin,
      };

      // Use jose (Edge Runtime compatible) instead of jsonwebtoken
      const secret = new TextEncoder().encode(signingSecret);
      session.supabaseAccessToken = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime(payload.exp)
        .sign(secret);

      session.user.id = user.id;
      session.user.isAdmin = isAdmin;
      return session;
    },
  },
});
