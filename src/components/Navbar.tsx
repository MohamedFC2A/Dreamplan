"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, LogIn, LogOut, Menu, UserCircle2, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

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
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-[70px] gap-3">
        <Link href="/" className="flex flex-col justify-center whitespace-nowrap leading-none">
          <span className="font-heading text-[15px] sm:text-[17px] md:text-[18px] font-bold text-white tracking-[0.17em]">
            DREAM<span className="text-gold-500">PLAN</span>
          </span>
          <span className="text-[8px] sm:text-[9px] md:text-[10px] text-gold-300/85 tracking-[0.14em] mt-1 uppercase">
            BUILT BY MATANY LABS
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 min-w-0">
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

        <div className="md:hidden flex items-center gap-2">
          {isGenerating ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gold-500/30 bg-gold-500/10 text-[10px] text-gold-300">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              AI
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? (locale === "ar" ? "إغلاق القائمة" : "Close menu") : (locale === "ar" ? "فتح القائمة" : "Open menu")}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
              mobileMenuOpen
                ? "border-gold-500/40 bg-gold-500/10 text-gold-300"
                : "border-dark-border bg-dark-card text-gray-300"
            }`}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-dark-border/60 bg-black/95">
          <div className="px-4 py-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {isProEnabled ? (
                <Link
                  href="/plans"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[10px] px-2.5 py-1 rounded-md border border-gold-500/35 bg-gold-500/10 text-gold-300 inline-flex items-center gap-1.5"
                >
                  <Crown className="w-3 h-3" />
                  PRO
                </Link>
              ) : null}
              {isGenerating ? (
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[10px] px-2.5 py-1 rounded-md border border-gold-500/35 bg-gold-500/10 text-gold-300"
                >
                  {locale === "ar" ? "NEXUS AI يعمل بالخلفية" : "NEXUS AI in background"}
                </Link>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-xl text-sm border transition-colors ${
                      isActive
                        ? "border-gold-500/35 bg-gold-500/10 text-gold-300"
                        : "border-dark-border bg-dark-card text-gray-300"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-dark-border/60 space-y-2">
              {isConfigured &&
                (authLoading ? (
                  <p className="text-xs text-gray-500 px-1">
                    {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                  </p>
                ) : user ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 px-1">
                      <span className="text-gold-300">{firstName}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full inline-flex items-center justify-center gap-2 text-xs px-3 py-2.5 rounded-xl border border-dark-border bg-dark-card text-gray-200"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {locale === "ar" ? "تسجيل الخروج" : "Sign Out"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs px-3 py-2.5 rounded-xl border border-gold-500/40 bg-gold-500/10 text-gold-300"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {locale === "ar" ? "Google دخول" : "Google Sign In"}
                  </button>
                ))}

              <button
                type="button"
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="w-full inline-flex items-center justify-center text-sm bg-dark-card border border-dark-border rounded-xl px-4 py-2.5 text-gold-400"
              >
                {locale === "ar" ? "English" : "العربية"}
              </button>
            </div>
          </div>
        </div>
      )}

      {authError && (
        <div className="px-4 py-1 text-center text-[11px] text-red-300 bg-red-500/10 border-t border-red-500/20">
          {authError}
        </div>
      )}
    </nav>
  );
}
