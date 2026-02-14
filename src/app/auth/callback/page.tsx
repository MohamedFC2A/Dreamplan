"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const finishAuth = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) {
        setStatus("error");
        setErrorMessage(
          locale === "ar"
            ? "إعدادات Supabase غير مكتملة."
            : "Supabase is not configured."
        );
        return;
      }

      const code = searchParams.get("code");
      const returnTo = searchParams.get("returnTo") || "/profile";

      if (!code) {
        setStatus("error");
        setErrorMessage(locale === "ar" ? "رمز تسجيل الدخول مفقود." : "Missing sign-in code.");
        return;
      }

      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      router.replace(returnTo);
    };

    finishAuth();
  }, [locale, router, searchParams]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="max-w-xl mx-auto px-4 pt-28 pb-10">
        <div className="rounded-2xl border border-dark-border bg-dark-card p-6 text-center">
          {status === "loading" ? (
            <>
              <p className="text-gold-400 font-heading tracking-wide uppercase text-xs">
                {locale === "ar" ? "NEXUS AI Auth" : "NEXUS AI Auth"}
              </p>
              <h1 className="text-xl font-heading font-bold text-white mt-2">
                {locale === "ar" ? "جاري تسجيل الدخول..." : "Completing sign-in..."}
              </h1>
            </>
          ) : (
            <>
              <h1 className="text-xl font-heading font-bold text-red-300">
                {locale === "ar" ? "فشل تسجيل الدخول" : "Sign-in failed"}
              </h1>
              <p className="text-sm text-gray-400 mt-2">{errorMessage}</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
