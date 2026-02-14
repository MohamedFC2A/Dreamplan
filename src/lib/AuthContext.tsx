"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase-browser";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: (returnTo?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isConfigured: false,
  signInWithGoogle: async () => ({}),
  signOut: async () => ({}),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = hasSupabaseEnv();

  useEffect(() => {
    if (!isConfigured) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    client.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isConfigured,
      signInWithGoogle: async (returnTo = "/profile") => {
        if (!isConfigured) {
          return { error: "Supabase is not configured." };
        }
        const client = getSupabaseBrowserClient();
        if (!client || typeof window === "undefined") {
          return { error: "Supabase client is unavailable." };
        }
        const redirectTo = new URL("/auth/callback", window.location.origin);
        redirectTo.searchParams.set("returnTo", returnTo);
        const { error } = await client.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: redirectTo.toString() },
        });
        return error ? { error: error.message } : {};
      },
      signOut: async () => {
        if (!isConfigured) return {};
        const client = getSupabaseBrowserClient();
        if (!client) return { error: "Supabase client is unavailable." };
        const { error } = await client.auth.signOut();
        return error ? { error: error.message } : {};
      },
    }),
    [isConfigured, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
