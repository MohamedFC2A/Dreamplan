"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, LogIn, LogOut, UserCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { getGenerationTaskSnapshot, subscribeGenerationTask } from "@/lib/generation-task";
import { getProAccessState } from "@/lib/pro-access";

export default function Navbar() {
  const { locale, setLocale } = useLanguage();
  const { user, isLoading: authLoading, isConfigured, signInWithGoogle, signOut } = useAuth();
  const pathname = usePathname();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProEnabled, setIsProEnabled] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const initial = getGenerationTaskSnapshot();
    setIsGenerating(initial.status === "running");
    const unsubscribe = subscribeGenerationTask((snapshot) => {
      setIsGenerating(snapshot.status === "running");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const syncPro = () => setIsProEnabled(getProAccessState().enabled);
    syncPro();
    window.addEventListener("storage", syncPro);
    window.addEventListener("focus", syncPro);
    return () => {
      window.removeEventListener("storage", syncPro);
      window.removeEventListener("focus", syncPro);
    };
  }, []);

  const links = [
    { href: "/", label: locale === "ar" ? "الرئيسية" : "Home" },
    { href: "/profile", label: locale === "ar" ? "الملف الشخصي" : "Profile" },
    { href: "/plans", label: locale === "ar" ? "الاشتراكات" : "Plans" },
  ];

  const firstName =
    user?.user_metadata?.full_name?.split?.(" ")?.[0] ||
    user?.email?.split("@")?.[0] ||
    (locale === "ar" ? "حسابك" : "Your Account");

  const handleGoogleSignIn = async () => {
    setAuthError("");
    const result = await signInWithGoogle(pathname || "/profile");
    if (result.error) setAuthError(result.error);
  };

  const handleSignOut = async () => {
    setAuthError("");
    const result = await signOut();
    if (result.error) setAuthError(result.error);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-dark-border/50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 gap-3">
        <Link href="/" className="font-heading text-base md:text-lg font-bold text-white tracking-widest whitespace-nowrap">
          <span className="block">
            DREAM<span className="text-gold-500">PLAN</span>
          </span>
          <span className="block text-[8px] md:text-[9px] text-gray-500 tracking-[0.18em] mt-0.5">
            BUILT BY MATANY LABS
          </span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
          {isGenerating && (
            <Link
              href="/"
              className="text-[10px] md:text-xs px-3 py-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 text-gold-300"
            >
              {locale === "ar" ? "NEXUS AI يعمل بالخلفية" : "NEXUS AI running in background"}
            </Link>
          )}
          {isProEnabled && (
            <Link
              href="/plans"
              className="text-[10px] md:text-xs px-3 py-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 text-gold-300 inline-flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              PRO
            </Link>
          )}
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs md:text-sm px-3 md:px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-gold-400 bg-gold-500/10 font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isConfigured &&
            (authLoading ? (
              <span className="text-[11px] text-gray-500 px-2">
                {locale === "ar" ? "جاري التحميل..." : "Loading..."}
              </span>
            ) : user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-[11px] md:text-xs px-2.5 py-1.5 rounded-lg border border-dark-border text-gray-300 hover:text-white hover:border-gold-500/30"
              >
                <UserCircle2 className="w-3.5 h-3.5 text-gold-400" />
                <span className="max-w-[7rem] truncate">{firstName}</span>
                <LogOut className="w-3 h-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1.5 text-[11px] md:text-xs px-2.5 py-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 text-gold-300 hover:bg-gold-500/15"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{locale === "ar" ? "Google دخول" : "Google Sign In"}</span>
              </button>
            ))}
          <button
            type="button"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="ms-2 bg-dark-card border border-dark-border rounded-full px-4 py-1.5 text-sm text-gold-400 hover:text-gold-300 hover:border-gold-500/50 transition-all duration-300"
          >
            {locale === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>
      {authError && (
        <div className="px-4 py-1 text-center text-[11px] text-red-300 bg-red-500/10 border-t border-red-500/20">
          {authError}
        </div>
      )}
    </nav>
  );
}
