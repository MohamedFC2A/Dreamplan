"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

export default function Navbar() {
  const { locale, setLocale } = useLanguage();
  const pathname = usePathname();

  const links = [
    { href: "/", label: locale === "ar" ? "الرئيسية" : "Home" },
    { href: "/plans", label: locale === "ar" ? "الاشتراكات" : "Plans" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-dark-border/50">
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-between h-16">
        <Link href="/" className="font-heading text-lg font-bold text-white tracking-widest">
          MASCULINE <span className="text-gold-500">PEAK</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-4 py-2 rounded-lg transition-all duration-200 ${
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
