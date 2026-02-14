"use client";

import { ProgressPoint } from "@/lib/protocols";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { Rocket, Sparkles, Target, Trophy } from "lucide-react";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toVisualScore(impact: number, maxImpact: number): number {
  if (maxImpact <= 0) return 0;
  return Math.round((impact / maxImpact) * 100);
}

function pickPoints(data: ProgressPoint[], maxItems: number): ProgressPoint[] {
  if (data.length <= maxItems) return data;
  const stride = Math.ceil(data.length / maxItems);
  return data.filter((_, index) => index % stride === 0 || index === data.length - 1);
}

export default function ProgressTracker({
  data,
  labelPrefix = "day",
}: {
  data: ProgressPoint[];
  labelPrefix?: "day" | "week";
}) {
  const { locale } = useLanguage();
  const sorted = [...(Array.isArray(data) ? data : [])]
    .filter((p) => Number.isFinite(p?.day) && Number.isFinite(p?.impact))
    .sort((a, b) => a.day - b.day);

  if (sorted.length === 0) return null;

  const maxImpact = Math.max(30, ...sorted.map((point) => point.impact));
  const baseline = sorted[0];
  const current = sorted[sorted.length - 1];
  const peak = sorted.reduce((best, item) => (item.impact > best.impact ? item : best), sorted[0]);

  const baselineScore = toVisualScore(baseline.impact, maxImpact);
  const currentScore = toVisualScore(current.impact, maxImpact);
  const peakScore = toVisualScore(peak.impact, maxImpact);
  const targetScore = clamp(
    currentScore >= 100 ? 100 : currentScore + Math.max(10, Math.round((100 - currentScore) * 0.35)),
    currentScore,
    100
  );

  const momentum = currentScore - baselineScore;
  const confidence = clamp(Math.round(62 + momentum * 0.45 + sorted.length * 0.3), 55, 99);
  const recoveryShield = clamp(Math.round(58 + currentScore * 0.25), 55, 95);
  const samplePoints = pickPoints(sorted, 14);

  const nextMilestoneScore = currentScore < 35 ? 35 : currentScore < 70 ? 70 : currentScore < 90 ? 90 : 100;
  const milestonePoint =
    sorted.find((item) => toVisualScore(item.impact, maxImpact) >= nextMilestoneScore) || current;

  const phaseLabel =
    currentScore < 35
      ? locale === "ar"
        ? "مرحلة التأسيس"
        : "Foundation Phase"
      : currentScore < 70
      ? locale === "ar"
        ? "مرحلة التسارع"
        : "Acceleration Phase"
      : locale === "ar"
      ? "مرحلة الإتقان"
      : "Mastery Phase";

  const heroText =
    momentum >= 45
      ? locale === "ar"
        ? "قفزة قوية في الشكل المرئي. استمر بنفس النسق وسترى فرقًا لافتًا جدًا."
        : "Major visual jump detected. Maintain this pace and your look will shift dramatically."
      : momentum >= 25
      ? locale === "ar"
        ? "تحسن واضح ومستقر. الخطة الآن في منطقة النتائج الحقيقية."
        : "Stable and visible improvement. Your plan is now in the real-results zone."
      : locale === "ar"
      ? "بداية ممتازة. الالتزام في هذه المرحلة هو مفتاح التحول السريع لاحقًا."
      : "Strong start. Consistency at this stage unlocks faster transformation next.";

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-lg font-bold text-gray-200 tracking-wide uppercase">
          {t(locale, "projectedImpact")}
        </h2>
        <span className="text-[10px] px-2.5 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-300 uppercase tracking-wider inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {phaseLabel}
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-5">{heroText}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          {
            key: "baseline",
            label: locale === "ar" ? "قبل التنفيذ" : "Before",
            sub: `${t(locale, labelPrefix === "week" ? "week" : "day")} ${baseline.day}`,
            value: baselineScore,
            icon: Target,
            color: "text-gray-200 border-dark-border bg-black/35",
          },
          {
            key: "current",
            label: locale === "ar" ? "المسار الحالي" : "Current Trajectory",
            sub: `${t(locale, labelPrefix === "week" ? "week" : "day")} ${current.day}`,
            value: currentScore,
            icon: Rocket,
            color: "text-gold-300 border-gold-500/30 bg-gold-500/10",
          },
          {
            key: "target",
            label: locale === "ar" ? "الهدف المتوقع" : "Projected Target",
            sub:
              locale === "ar"
                ? `قابل للتحقيق خلال ${sorted.length} ${labelPrefix === "week" ? "أسبوع" : "يوم"}`
                : `Reachable across ${sorted.length} ${labelPrefix === "week" ? "weeks" : "days"}`,
            value: targetScore,
            icon: Trophy,
            color: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
          },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className={`rounded-xl border p-4 ${card.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest">{card.label}</p>
                <Icon className="w-4 h-4" />
              </div>
              <p className="font-heading text-3xl leading-none">{card.value}%</p>
              <p className="text-xs text-gray-400 mt-2">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dark-border bg-black/35 p-4 mb-5">
        <div className="flex items-center justify-between text-[11px] text-gray-500 uppercase tracking-wider mb-2">
          <span>{locale === "ar" ? "مقارنة التقدم" : "Trajectory Comparison"}</span>
          <span>{currentScore}%</span>
        </div>
        <div className="relative h-3 rounded-full bg-[#121212] overflow-hidden border border-dark-border">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #6b7280, #d4af37 55%, #10b981)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${currentScore}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-300 bg-black"
            style={{ left: `calc(${baselineScore}% - 6px)` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gold-400 bg-black"
            style={{ left: `calc(${currentScore}% - 6px)` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-emerald-400 bg-black"
            style={{ left: `calc(${targetScore}% - 6px)` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
          <span>{locale === "ar" ? "البداية" : "Start"}</span>
          <span>{locale === "ar" ? "الحالي" : "Current"}</span>
          <span>{locale === "ar" ? "المستهدف" : "Target"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-dark-border bg-black/35 p-4">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
            {locale === "ar" ? "زخم التحول" : "Transformation Momentum"}
          </p>
          <p className="font-heading text-2xl text-gold-300">{momentum >= 0 ? `+${momentum}` : momentum}%</p>
        </div>
        <div className="rounded-xl border border-dark-border bg-black/35 p-4">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
            {locale === "ar" ? "ثقة النتيجة" : "Outcome Confidence"}
          </p>
          <p className="font-heading text-2xl text-emerald-300">{confidence}%</p>
        </div>
        <div className="rounded-xl border border-dark-border bg-black/35 p-4">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
            {locale === "ar" ? "حماية الاستمرارية" : "Consistency Shield"}
          </p>
          <p className="font-heading text-2xl text-cyan-300">{recoveryShield}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-dark-border bg-black/30 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[11px] uppercase tracking-widest text-gray-500">
            {locale === "ar" ? "لقطات التقدم" : "Progress Snapshots"}
          </p>
          <p className="text-xs text-gold-300">
            {locale === "ar"
              ? `أقرب محطة: ${t(locale, labelPrefix === "week" ? "week" : "day")} ${milestonePoint.day}`
              : `Next milestone: ${t(locale, labelPrefix === "week" ? "week" : "day")} ${milestonePoint.day}`}
          </p>
        </div>
        <div className="grid grid-cols-7 md:grid-cols-14 gap-1.5 items-end h-20">
          {samplePoints.map((point, index) => {
            const bar = toVisualScore(point.impact, maxImpact);
            return (
              <motion.div
                key={`${point.day}-${index}`}
                initial={{ height: 4, opacity: 0 }}
                animate={{ height: `${Math.max(8, bar)}%`, opacity: 1 }}
                transition={{ delay: index * 0.03, duration: 0.35 }}
                className={`rounded-sm ${index === samplePoints.length - 1 ? "bg-gold-400" : "bg-gray-600/80"}`}
                title={`${t(locale, labelPrefix === "week" ? "week" : "day")} ${point.day}: ${bar}%`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
