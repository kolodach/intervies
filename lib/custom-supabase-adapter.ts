import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "next-auth/adapters";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function CustomSupabaseAdapter(config: {
  url: string;
  secret: string;
}): Adapter {
  const supabase: SupabaseClient = createClient(config.url, config.secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return {
    async createUser(user) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified?.toISOString(),
          image: user.image,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AdapterUser;
    },

    async getUser(id) {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("id", id)
        .single();

      if (error) return null;
      return data as AdapterUser;
    },

    async getUserByEmail(email) {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("email", email)
        .single();

      if (error) return null;
      return data as AdapterUser;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const { data, error } = await supabase
        .from("accounts")
        .select("users(*)")
        .eq("providerAccountId", providerAccountId)
        .eq("provider", provider)
        .single();

      if (error || !data) return null;
      return (data as any).users as AdapterUser;
    },

    async updateUser(user) {
      const { data, error } = await supabase
        .from("users")
        .update({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified?.toISOString(),
          image: user.image,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as AdapterUser;
    },

    async deleteUser(userId) {
      await supabase.from("users").delete().eq("id", userId);
    },

    async linkAccount(account) {
      await supabase.from("accounts").insert({
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await supabase
        .from("accounts")
        .delete()
        .eq("providerAccountId", providerAccountId)
        .eq("provider", provider);
    },

    async createSession(session) {
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        expires: new Date(data.expires),
      } as AdapterSession;
    },

    async getSessionAndUser(sessionToken) {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, users(*)")
        .eq("sessionToken", sessionToken)
        .single();

      if (error || !data) return null;
      
      const { users, ...session } = data as any;
      return {
        session: {
          ...session,
          expires: new Date(session.expires),
        } as AdapterSession,
        user: users as AdapterUser,
      };
    },

    async updateSession(session) {
      const { data, error } = await supabase
        .from("sessions")
        .update({
          expires: session.expires?.toISOString(),
        })
        .eq("sessionToken", session.sessionToken)
        .select()
        .single();

      if (error) return null;
      return {
        ...data,
        expires: new Date(data.expires),
      } as AdapterSession;
    },

    async deleteSession(sessionToken) {
      await supabase.from("sessions").delete().eq("sessionToken", sessionToken);
    },

    async createVerificationToken(verificationToken) {
      const { data, error } = await supabase
        .from("verification_tokens")
        .insert({
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        expires: new Date(data.expires),
      };
    },

    async useVerificationToken({ identifier, token }) {
      const { data, error } = await supabase
        .from("verification_tokens")
        .delete()
        .eq("identifier", identifier)
        .eq("token", token)
        .select()
        .single();

      if (error || !data) return null;
      return {
        ...data,
        expires: new Date(data.expires),
      };
    },
  };
}

