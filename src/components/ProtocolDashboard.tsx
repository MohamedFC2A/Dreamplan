"use client";

import { Protocol } from "@/lib/protocols";
import { motion } from "framer-motion";
import Link from "next/link";
import ProgressTracker from "@/components/ProgressTracker";
import DayCard from "@/components/DayCard";
import WeekCard from "@/components/WeekCard";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import {
  Zap,
  FlaskConical,
  ArrowRight,
  ArrowLeft,
  ListChecks,
  Star,
  Calendar,
  ShieldAlert,
  Target,
  UserCircle2,
  Sunrise,
  UtensilsCrossed,
  Pill,
  Dumbbell,
  Heart,
  Droplets,
  Moon,
  Crown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { hasProAccess } from "@/lib/pro-access";

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
        strokeDasharray={`${circumference} ${circumference}`}
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

function normalizeProgress(total: number) {
  return Array.from({ length: Math.max(1, total) }, (_, index) => ({
    day: index + 1,
    impact: Math.round(((index + 1) / Math.max(1, total)) * 30),
  }));
}

const SECTION_META = [
  { key: "wake", icon: Sunrise, en: "Wake", ar: "استيقاظ" },
  { key: "meal", icon: UtensilsCrossed, en: "Nutrition", ar: "تغذية" },
  { key: "supplement", icon: Pill, en: "Supplements", ar: "مكملات" },
  { key: "training", icon: Dumbbell, en: "Training", ar: "تدريب" },
  { key: "recovery", icon: Heart, en: "Recovery", ar: "تعافي" },
  { key: "hydration", icon: Droplets, en: "Hydration", ar: "ترطيب" },
  { key: "sleep", icon: Moon, en: "Sleep", ar: "نوم" },
] as const;

export default function ProtocolDashboard({ protocol }: { protocol: Protocol }) {
  const { locale, isRTL } = useLanguage();
  const [proEnabled, setProEnabled] = useState(false);

  useEffect(() => {
    const syncPro = () => setProEnabled(hasProAccess());
    syncPro();
    window.addEventListener("storage", syncPro);
    window.addEventListener("focus", syncPro);
    return () => {
      window.removeEventListener("storage", syncPro);
      window.removeEventListener("focus", syncPro);
    };
  }, []);

  const safeDays = Array.isArray(protocol?.days)
    ? protocol.days.filter((day) => day && Array.isArray(day.tasks))
    : [];
  const safeWeeks = Array.isArray(protocol?.weeks)
    ? protocol.weeks.filter((week) => week && Array.isArray(week.tasks))
    : [];

  const inferredMode: "daily" | "weekly" =
    protocol?.planMode === "weekly" || (safeWeeks.length > 0 && safeDays.length === 0) ? "weekly" : "daily";

  const totalUnits =
    inferredMode === "weekly"
      ? protocol?.durationWeeks || safeWeeks.length || Math.ceil((protocol?.durationDays || 7) / 7)
      : protocol?.durationDays || safeDays.length || 7;

  const safeProgressData =
    Array.isArray(protocol?.progressData) && protocol.progressData.length > 0
      ? protocol.progressData
      : normalizeProgress(totalUnits);

  const title =
    locale === "ar"
      ? protocol?.titleAr || protocol?.title || "بروتوكول مخصص"
      : protocol?.title || protocol?.titleAr || "Personalized Protocol";
  const subtitle =
    locale === "ar"
      ? protocol?.subtitleAr || protocol?.subtitle || ""
      : protocol?.subtitle || protocol?.subtitleAr || "";
  const focusRaw = locale === "ar" ? protocol?.focusAr : protocol?.focus;
  const focusNormalized =
    Array.isArray(focusRaw) && focusRaw.length > 0
      ? focusRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  const focus =
    focusNormalized.length > 0
      ? focusNormalized
      : locale === "ar"
      ? ["الالتزام", "التعافي", "التدرج"]
      : ["Consistency", "Recovery", "Progressive plan"];
  const overview =
    locale === "ar"
      ? protocol?.scienceOverviewAr || protocol?.scienceOverview || ""
      : protocol?.scienceOverview || protocol?.scienceOverviewAr || "";

  const profileFitSummary =
    locale === "ar"
      ? protocol?.profileFitSummaryAr || protocol?.profileFitSummary || ""
      : protocol?.profileFitSummary || protocol?.profileFitSummaryAr || "";
  const safetyNotesGlobalRaw =
    locale === "ar" ? protocol?.safetyNotesGlobalAr || protocol?.safetyNotesGlobal : protocol?.safetyNotesGlobal || protocol?.safetyNotesGlobalAr;
  const safetyNotesGlobal =
    Array.isArray(safetyNotesGlobalRaw) && safetyNotesGlobalRaw.length > 0
      ? safetyNotesGlobalRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  const priorityActionsRaw =
    locale === "ar" ? protocol?.priorityActionsAr || protocol?.priorityActions : protocol?.priorityActions || protocol?.priorityActionsAr;
  const priorityActions =
    Array.isArray(priorityActionsRaw) && priorityActionsRaw.length > 0
      ? priorityActionsRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];

  const { totalTasks, totalPoints } = useMemo(() => {
    let tasks = 0;
    let points = 0;
    const pointsMap: Record<string, number> = { high: 15, medium: 10, low: 5 };

    if (inferredMode === "weekly") {
      for (const week of safeWeeks) {
        tasks += week.tasks.length;
        for (const task of week.tasks) {
          points += pointsMap[task.visualImpact] || 5;
        }
      }
    } else {
      for (const day of safeDays) {
        tasks += day.tasks.length;
        for (const task of day.tasks) {
          points += pointsMap[task.visualImpact] || 5;
        }
      }
    }

    return { totalTasks: tasks, totalPoints: points };
  }, [inferredMode, safeWeeks, safeDays]);

  const sectionCounts = useMemo(() => {
    const counts = SECTION_META.reduce<Record<string, number>>((acc, section) => {
      acc[section.key] = 0;
      return acc;
    }, {});

    const buckets =
      inferredMode === "weekly"
        ? safeWeeks.flatMap((week) => week.tasks)
        : safeDays.flatMap((day) => day.tasks);

    for (const task of buckets) {
      counts[task.category] = (counts[task.category] || 0) + 1;
    }
    return counts;
  }, [inferredMode, safeWeeks, safeDays]);

  const primarySection = useMemo(() => {
    const ranked = Object.entries(sectionCounts).sort((a, b) => b[1] - a[1]);
    return ranked[0]?.[0] || "training";
  }, [sectionCounts]);

  const adherenceForecast = useMemo(() => {
    const base = totalTasks > 0 ? 72 : 60;
    const density = totalUnits > 0 ? totalTasks / totalUnits : 0;
    return Math.max(55, Math.min(97, Math.round(base + density * 3)));
  }, [totalTasks, totalUnits]);

  const recoveryCoverage = useMemo(() => {
    const recoveryTasks = (sectionCounts.recovery || 0) + (sectionCounts.sleep || 0);
    if (totalTasks <= 0) return 0;
    return Math.round((recoveryTasks / totalTasks) * 100);
  }, [sectionCounts, totalTasks]);

  const visualMomentum = useMemo(() => {
    if (totalTasks <= 0) return 0;
    return Math.round(totalPoints / totalTasks);
  }, [totalPoints, totalTasks]);

  const timelineList = inferredMode === "weekly" ? safeWeeks : safeDays;

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

        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20">
          <span className="text-[10px] text-gold-400 font-bold uppercase tracking-widest">
            {t(locale, "aiPowered")} <Zap className="w-3 h-3 text-gold-400 inline" />
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest border-l border-gold-500/20 ltr:pl-2 rtl:pr-2">
            {inferredMode === "weekly" ? t(locale, "weeklyMode") : t(locale, "dailyMode")}
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="bg-dark-card border border-gold-500/25 rounded-xl p-5 mb-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-gold-400">
              {locale === "ar" ? "الملخص التنفيذي للبروتوكول" : "Protocol Executive Brief"}
            </h2>
            <span className="text-[10px] px-2 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-300 uppercase tracking-wider">
              {inferredMode === "weekly" ? (locale === "ar" ? "نمط أسبوعي" : "Weekly mode") : (locale === "ar" ? "نمط يومي" : "Daily mode")}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-dark-border bg-black/35 p-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
                {locale === "ar" ? "الهدف الرئيسي" : "Main Objective"}
              </p>
              <p className="text-sm text-gray-200">{subtitle || (locale === "ar" ? "تحسين تدريجي واضح قابل للتنفيذ." : "Clear and realistic progressive improvement.")}</p>
            </div>
            <div className="rounded-lg border border-dark-border bg-black/35 p-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
                {locale === "ar" ? "الإيقاع" : "Execution Rhythm"}
              </p>
              <p className="text-sm text-gray-200">
                {inferredMode === "weekly"
                  ? locale === "ar"
                    ? `${totalUnits} أسابيع بمهام مركزة أسبوعيًا.`
                    : `${totalUnits} weeks with concentrated weekly deliverables.`
                  : locale === "ar"
                  ? `${totalUnits} أيام بتسلسل يومي واضح.`
                  : `${totalUnits} days with clear day-by-day sequencing.`}
              </p>
            </div>
            <div className="rounded-lg border border-dark-border bg-black/35 p-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
                {locale === "ar" ? "محرك الخطة" : "Primary Driver"}
              </p>
              <p className="text-sm text-gray-200">
                {SECTION_META.find((item) => item.key === primarySection)?.[locale === "ar" ? "ar" : "en"]}{" "}
                {locale === "ar" ? "هو الجزء الأكثر تأثيرًا في هذه الخطة." : "is the strongest execution lever in this plan."}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5 mb-6">
          <h3 className="font-heading text-xs uppercase tracking-[0.18em] text-gold-400 mb-4">
            {locale === "ar" ? "خريطة الأقسام بالأيقونات" : "Section Map with Icons"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SECTION_META.map((section) => {
              const Icon = section.icon;
              const count = sectionCounts[section.key] || 0;
              return (
                <div key={section.key} className="rounded-lg border border-dark-border bg-black/35 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-300">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] text-gold-300 font-bold">{count}</span>
                  </div>
                  <p className="text-xs text-gray-300">{locale === "ar" ? section.ar : section.en}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {[
            {
              titleAr: "توقع الالتزام",
              titleEn: "Adherence Forecast",
              value: `${adherenceForecast}%`,
              detailAr: "تقدير استمرارية التنفيذ بناءً على كثافة المهام.",
              detailEn: "Estimated consistency based on task density.",
            },
            {
              titleAr: "تغطية الاستشفاء",
              titleEn: "Recovery Coverage",
              value: `${recoveryCoverage}%`,
              detailAr: "نسبة مهام التعافي والنوم من إجمالي الخطة.",
              detailEn: "Recovery + sleep tasks ratio within the protocol.",
            },
            {
              titleAr: "الزخم البصري",
              titleEn: "Visual Momentum",
              value: `${visualMomentum}`,
              detailAr: "متوسط نقاط التأثير لكل مهمة.",
              detailEn: "Average impact points per task.",
            },
          ].map((item) => (
            <div
              key={item.titleEn}
              className={`rounded-xl border p-4 ${
                proEnabled
                  ? "border-gold-500/25 bg-gold-500/5"
                  : "border-dark-border bg-black/35 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
                  {locale === "ar" ? item.titleAr : item.titleEn}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-300">
                  <Crown className="w-3 h-3" />
                  PRO
                </span>
              </div>
              <p className={`font-heading text-2xl ${proEnabled ? "text-gold-300" : "text-gray-500"}`}>
                {proEnabled ? item.value : "--"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {proEnabled
                  ? locale === "ar"
                    ? item.detailAr
                    : item.detailEn
                  : locale === "ar"
                  ? "فعّل PRO من صفحة الاشتراكات لعرض التحليلات المتقدمة."
                  : "Enable PRO from Plans to unlock this advanced insight."}
              </p>
              {!proEnabled ? (
                <Link
                  href="/plans"
                  className="inline-block mt-3 text-[11px] text-gold-300 hover:text-gold-200"
                >
                  {locale === "ar" ? "تفعيل PRO" : "Activate PRO"}
                </Link>
              ) : null}
            </div>
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
                <span className="text-lg font-bold text-gold-400">{totalUnits}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {inferredMode === "weekly" ? t(locale, "weeksLabel") : t(locale, "daysLabel")}
                </span>
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
                  <p className="text-xs text-gray-500">
                    {inferredMode === "weekly" ? t(locale, "weeksLabel") : t(locale, "daysLabel")}
                  </p>
                  <p className="text-lg font-bold text-gray-100">{totalUnits}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {(profileFitSummary || safetyNotesGlobal.length > 0 || priorityActions.length > 0) && (
          <>
            <GoldDivider />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <h3 className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-2">
                  {t(locale, "profileFitPanel")} <UserCircle2 className="w-3 h-3 inline" />
                </h3>
                <p className="text-sm text-gray-400">
                  {profileFitSummary ||
                    (locale === "ar"
                      ? "تمت معايرة الخطة وفق بياناتك الأساسية."
                      : "The plan was calibrated to your baseline profile.")}
                </p>
              </div>

              <div className="bg-dark-card border border-red-500/20 rounded-xl p-4">
                <h3 className="text-xs uppercase tracking-widest text-red-300 font-bold mb-2">
                  {t(locale, "safetyPanel")} <ShieldAlert className="w-3 h-3 inline" />
                </h3>
                {safetyNotesGlobal.length > 0 ? (
                  <ul className="space-y-1">
                    {safetyNotesGlobal.map((note, index) => (
                      <li key={`${note}-${index}`} className="text-xs text-red-200">
                        - {note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    {locale === "ar" ? "لا توجد ملاحظات أمان إضافية." : "No additional safety notes."}
                  </p>
                )}
              </div>

              <div className="bg-dark-card border border-gold-500/20 rounded-xl p-4">
                <h3 className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-2">
                  {t(locale, "priorityPanel")} <Target className="w-3 h-3 inline" />
                </h3>
                {priorityActions.length > 0 ? (
                  <ul className="space-y-1">
                    {priorityActions.map((item, index) => (
                      <li key={`${item}-${index}`} className="text-xs text-gray-300">
                        - {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    {locale === "ar" ? "لا توجد أولويات إضافية." : "No extra priority actions."}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

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
          {overview ? (
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="text-gold-400 text-xl font-bold float-left mr-2 mt-0.5 leading-none">
                {overview.charAt(0)}
              </span>
              {overview.slice(1)}
            </p>
          ) : (
            <p className="text-gray-500 text-sm leading-relaxed">
              {locale === "ar" ? "تفاصيل علمية غير متاحة لهذا البروتوكول." : "Science overview is not available for this protocol."}
            </p>
          )}
        </motion.div>

        <GoldDivider />

        <ProgressTracker data={safeProgressData} labelPrefix={inferredMode === "weekly" ? "week" : "day"} />

        <GoldDivider />

        <div className="mb-4">
          <h2 className="font-heading text-lg font-bold text-gray-200 tracking-wide uppercase">
            {inferredMode === "weekly" ? t(locale, "weeklyTimeline") : t(locale, "dailyTimeline")}
          </h2>
        </div>
        <div className="space-y-4">
          {timelineList.length === 0 ? (
            <div className="rounded-xl border border-dark-border bg-dark-card p-6 text-center text-gray-500 text-sm">
              {locale === "ar"
                ? "لا توجد تفاصيل كافية لعرض الجدول."
                : "No enough structured details to render the timeline."}
            </div>
          ) : inferredMode === "weekly" ? (
            safeWeeks.map((week, weekIndex) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: weekIndex * 0.08, duration: 0.4 }}
              >
                <WeekCard week={week} weekIndex={weekIndex} />
              </motion.div>
            ))
          ) : (
            safeDays.map((day, dayIndex) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.08, duration: 0.4 }}
              >
                <DayCard day={day} dayIndex={dayIndex} />
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </main>
  );
}
