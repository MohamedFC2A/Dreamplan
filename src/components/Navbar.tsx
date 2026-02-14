"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { getGenerationTaskSnapshot, subscribeGenerationTask } from "@/lib/generation-task";

export default function Navbar() {
  const { locale, setLocale } = useLanguage();
  const pathname = usePathname();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const initial = getGenerationTaskSnapshot();
    setIsGenerating(initial.status === "running");
    const unsubscribe = subscribeGenerationTask((snapshot) => {
      setIsGenerating(snapshot.status === "running");
    });
    return () => unsubscribe();
  }, []);

  const links = [
    { href: "/", label: locale === "ar" ? "الرئيسية" : "Home" },
    { href: "/cr7-fba", label: "CR7 FBA" },
    { href: "/profile", label: locale === "ar" ? "الملف الشخصي" : "Profile" },
    { href: "/plans", label: locale === "ar" ? "الاشتراكات" : "Plans" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-dark-border/50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 gap-3">
        <Link href="/" className="font-heading text-base md:text-lg font-bold text-white tracking-widest whitespace-nowrap">
          DREAM<span className="text-gold-500">PLAN</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
          {isGenerating && (
            <Link
              href="/"
              className="text-[10px] md:text-xs px-3 py-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 text-gold-300"
            >
              {locale === "ar" ? "AI يعمل بالخلفية" : "AI running in background"}
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
          <button
            type="button"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="ms-2 bg-dark-card border border-dark-border rounded-full px-4 py-1.5 text-sm text-gold-400 hover:text-gold-300 hover:border-gold-500/50 transition-all duration-300"
          >
            {locale === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>
    </nav>
  );
}
