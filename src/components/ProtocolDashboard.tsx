"use client";

import { Protocol } from "@/lib/protocols";
import { motion } from "framer-motion";
import Link from "next/link";
import ProgressTracker from "@/components/ProgressTracker";
import DayCard from "@/components/DayCard";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

export default function ProtocolDashboard({ protocol }: { protocol: Protocol }) {
  const { locale } = useLanguage();

  const title = locale === "ar" ? protocol.titleAr : protocol.title;
  const subtitle = locale === "ar" ? protocol.subtitleAr : protocol.subtitle;
  const focus = locale === "ar" ? protocol.focusAr : protocol.focus;
  const overview = locale === "ar" ? protocol.scienceOverviewAr : protocol.scienceOverview;

  return (
    <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
      <LanguageToggle />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/"
          className="text-gold-400 hover:text-gold-300 text-sm font-medium mb-8 inline-flex items-center gap-1 transition-colors"
        >
          {locale === "ar" ? "→" : "←"} {t(locale, "backToHome")}
        </Link>

        <div className="mb-2 inline-block px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20">
          <span className="text-[10px] text-gold-400 font-bold uppercase tracking-widest">
            {t(locale, "aiPowered")} ⚡
          </span>
        </div>

        <h1 className="font-heading text-3xl md:text-5xl font-bold text-gray-100 mb-2 tracking-wide">
          {title}
        </h1>
        <p className="text-gray-500 text-lg mb-8">{subtitle}</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {focus.map((f) => (
            <span
              key={f}
              className="text-xs px-3 py-1.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20"
            >
              {f}
            </span>
          ))}
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8">
          <h2 className="font-heading text-lg font-bold text-gray-200 mb-3 tracking-wide uppercase">
            {t(locale, "scienceOverview")} 🔬
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {overview}
          </p>
        </div>

        <ProgressTracker data={protocol.progressData} />

        <div className="space-y-4">
          {protocol.days.map((day, dayIndex) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.08, duration: 0.4 }}
            >
              <DayCard day={day} dayIndex={dayIndex} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </main>
  );
}
