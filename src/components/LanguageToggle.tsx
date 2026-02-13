"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className="fixed top-4 z-50 bg-dark-card border border-dark-border rounded-full px-4 py-2 text-sm text-gold-400 hover:text-gold-300 hover:border-gold-500 transition-all duration-300 ltr:right-4 rtl:left-4"
    >
      {t(locale, "language")}
    </button>
  );
}
