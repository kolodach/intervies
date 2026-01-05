import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { CustomSupabaseAdapter } from "./custom-supabase-adapter";
import * as jose from "jose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true, // Enable detailed error logging
  providers: [Google],
  adapter: CustomSupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }),
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, user }) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: user.id,
          email: user.email,
          role: "authenticated",
        };

        // Use jose (Edge Runtime compatible) instead of jsonwebtoken
        const secret = new TextEncoder().encode(signingSecret);
        session.supabaseAccessToken = await new jose.SignJWT(payload)
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setIssuedAt()
          .setExpirationTime(payload.exp)
          .sign(secret);
      }
      session.user.id = user.id;
      return session;
    },
  },
});
