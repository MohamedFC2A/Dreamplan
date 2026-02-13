"use client";

import { Protocol } from "@/lib/protocols";
import { motion } from "framer-motion";
import Link from "next/link";
import ProgressTracker from "@/components/ProgressTracker";
import DayCard from "@/components/DayCard";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { Zap, FlaskConical, ArrowRight, ArrowLeft, ListChecks, Star, Calendar } from "lucide-react";
import { useMemo } from "react";

function GoldDivider() {
  return (
    <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
  );
}

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 40;
  const stroke = 5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
      <circle
        stroke="rgba(180, 150, 80, 0.15)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="url(#goldGradient)"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference + " " + circumference}
        strokeDashoffset={strokeDashoffset}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a843" />
          <stop offset="100%" stopColor="#b8962e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ProtocolDashboard({ protocol }: { protocol: Protocol }) {
  const { locale, isRTL } = useLanguage();

  const title = locale === "ar" ? protocol.titleAr : protocol.title;
  const subtitle = locale === "ar" ? protocol.subtitleAr : protocol.subtitle;
  const focus = locale === "ar" ? protocol.focusAr : protocol.focus;
  const overview = locale === "ar" ? protocol.scienceOverviewAr : protocol.scienceOverview;

  const { totalTasks, totalPoints } = useMemo(() => {
    let tasks = 0;
    let points = 0;
    const pointsMap: Record<string, number> = { high: 15, medium: 10, low: 5 };
    for (const day of protocol.days) {
      tasks += day.tasks.length;
      for (const task of day.tasks) {
        points += pointsMap[task.visualImpact] || 5;
      }
    }
    return { totalTasks: tasks, totalPoints: points };
  }, [protocol.days]);

  const totalDays = protocol.days.length;

  return (
    <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto pt-20">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/"
          className="text-gold-400 hover:text-gold-300 text-sm font-medium mb-8 inline-flex items-center gap-1 transition-colors"
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {t(locale, "backToHome")}
        </Link>

        <div className="mb-2 inline-block px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20">
          <span className="text-[10px] text-gold-400 font-bold uppercase tracking-widest">
            {t(locale, "aiPowered")} <Zap className="w-3 h-3 text-gold-400 inline" />
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

        <GoldDivider />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="bg-dark-card border border-gold-500/20 rounded-xl p-6 mb-8"
        >
          <h2 className="font-heading text-sm font-bold text-gold-400 mb-5 tracking-widest uppercase">
            {t(locale, "protocolSummary")}
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative flex-shrink-0">
              <CircularProgress percentage={100} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-gold-400">{totalDays}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t(locale, "daysLabel")}</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="flex items-center gap-3 bg-black/30 rounded-lg px-4 py-3 border border-dark-border">
                <div className="w-9 h-9 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <ListChecks className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t(locale, "totalTasks")}</p>
                  <p className="text-lg font-bold text-gray-100">{totalTasks}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-black/30 rounded-lg px-4 py-3 border border-dark-border">
                <div className="w-9 h-9 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t(locale, "totalPossiblePoints")}</p>
                  <p className="text-lg font-bold text-gray-100">{totalPoints}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-black/30 rounded-lg px-4 py-3 border border-dark-border">
                <div className="w-9 h-9 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t(locale, "daysLabel")}</p>
                  <p className="text-lg font-bold text-gray-100">{totalDays}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <GoldDivider />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8 border-l-2 border-r-2 border-l-gold-500/30 border-r-gold-500/30"
        >
          <h2 className="font-heading text-lg font-bold text-gray-200 mb-3 tracking-wide uppercase">
            {t(locale, "scienceOverview")} <FlaskConical className="w-4 h-4 text-gray-200 inline" />
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            <span className="text-gold-400 text-xl font-bold float-left mr-2 mt-0.5 leading-none">
              {overview.charAt(0)}
            </span>
            {overview.slice(1)}
          </p>
        </motion.div>

        <GoldDivider />

        <ProgressTracker data={protocol.progressData} />

        <GoldDivider />

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
