"use client";

import { ProgressPoint } from "@/lib/protocols";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

interface RegressionStats {
  slope: number;
  intercept: number;
  r2: number;
  sigma: number;
  mae: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getImpactScale(maxImpact: number): number {
  return maxImpact <= 35 ? 100 / 30 : 1;
}

function toScore(value: number, scale: number): number {
  return clamp(value * scale, 0, 100);
}

function computeRegression(values: number[]): RegressionStats {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0, sigma: 0, mae: 0 };
  if (n === 1) return { slope: 0, intercept: values[0], r2: 1, sigma: 0, mae: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = sumY / n - slope * (sumX / n);

  const meanY = sumY / n;
  let ssRes = 0;
  let ssTot = 0;
  let absError = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = values[i];
    const yHat = intercept + slope * x;
    const residual = y - yHat;
    ssRes += residual * residual;
    ssTot += (y - meanY) * (y - meanY);
    absError += Math.abs(residual);
  }

  const r2 = ssTot > 0 ? clamp(1 - ssRes / ssTot, 0, 1) : 1;
  const sigma = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
  const mae = absError / n;
  return { slope, intercept, r2, sigma, mae };
}

function findMilestoneIndex(data: ProgressPoint[], ratio: number): number {
  const target = Math.round((data.length - 1) * ratio);
  return clamp(target, 0, Math.max(0, data.length - 1));
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

  const values = sorted.map((item) => item.impact);
  const maxImpact = Math.max(1, ...values);
  const scale = getImpactScale(maxImpact);
  const baseline = sorted[0];
  const current = sorted[sorted.length - 1];
  const scoredSeries = sorted.map((item) => ({
    unit: item.day,
    score: toScore(item.impact, scale),
  }));
  const baselineScore = toScore(baseline.impact, scale);
  const currentScore = toScore(current.impact, scale);
  const deltaScore = currentScore - baselineScore;

  const regression = computeRegression(values);
  const perUnitGain = regression.slope * scale;
  const perWeekGain =
    labelPrefix === "week"
      ? perUnitGain
      : perUnitGain * 7;

  const nextX = sorted.length + 1;
  const nextPredRaw = regression.intercept + regression.slope * nextX;
  const nextPredScore = clamp(toScore(nextPredRaw, scale), 0, 100);
  const ciBand = toScore(1.28 * regression.sigma, scale);
  const nextLow = clamp(nextPredScore - ciBand, 0, 100);
  const nextHigh = clamp(nextPredScore + ciBand, 0, 100);

  const q1 = sorted[findMilestoneIndex(sorted, 0.25)];
  const q2 = sorted[findMilestoneIndex(sorted, 0.5)];
  const q3 = sorted[findMilestoneIndex(sorted, 0.75)];
  const milestones = [q1, q2, q3, current];

  const deltaColumns = scoredSeries.map((item, index) => ({
    unit: item.unit,
    delta: index === 0 ? 0 : item.score - scoredSeries[index - 1].score,
  }));
  const maxAbsDelta = Math.max(
    0.1,
    ...deltaColumns.map((item) => Math.abs(item.delta))
  );
  const avgDelta =
    deltaColumns.length > 1
      ? deltaColumns.slice(1).reduce((sum, item) => sum + item.delta, 0) /
        (deltaColumns.length - 1)
      : 0;
  const bestDelta = deltaColumns.slice(1).reduce((best, item) => {
    if (!best || item.delta > best.delta) return item;
    return best;
  }, deltaColumns[1] || null);
  const deltaLabelStride =
    deltaColumns.length <= 12
      ? 1
      : deltaColumns.length <= 24
      ? 2
      : deltaColumns.length <= 40
      ? 4
      : 7;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 sm:p-6 mb-8 ux-card">
      <h2 className="font-heading text-lg font-bold text-gray-200 mb-4 tracking-wide uppercase">
        {t(locale, "projectedImpact")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-dark-border bg-black/35 p-4 ux-card-soft">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
            {locale === "ar" ? "خط الأساس" : "Baseline Score"}
          </p>
          <p className="font-heading text-3xl text-gray-100">{baselineScore.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {t(locale, labelPrefix === "week" ? "week" : "day")} {baseline.day}
          </p>
        </div>

        <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 ux-card-soft">
          <p className="text-[11px] uppercase tracking-widest text-gold-300 mb-1">
            {locale === "ar" ? "المستوى الحالي المتوقع" : "Current Projected Score"}
          </p>
          <p className="font-heading text-3xl text-gold-200">{currentScore.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {t(locale, labelPrefix === "week" ? "week" : "day")} {current.day}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 ux-card-soft">
          <p className="text-[11px] uppercase tracking-widest text-emerald-300 mb-1">
            {locale === "ar" ? "صافي التحسن" : "Net Improvement"}
          </p>
          <p className="font-heading text-3xl text-emerald-200">
            {deltaScore >= 0 ? "+" : ""}
            {deltaScore.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {locale === "ar" ? "الحالي - خط الأساس" : "Current - Baseline"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dark-border bg-black/35 p-4 mb-4">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">
          {locale === "ar" ? "نموذج التوقع (انحدار خطي)" : "Projection Model (Linear Regression)"}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-dark-border bg-black/50 px-3 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">R²</p>
            <p className="text-gray-100 font-heading">{(regression.r2 * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border border-dark-border bg-black/50 px-3 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              {locale === "ar" ? "معدل التحسن/أسبوع" : "Gain / Week"}
            </p>
            <p className="text-gray-100 font-heading">{perWeekGain.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-dark-border bg-black/50 px-3 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">MAE</p>
            <p className="text-gray-100 font-heading">{toScore(regression.mae, scale).toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-dark-border bg-black/50 px-3 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              {locale === "ar" ? "النقطة التالية (80% CI)" : "Next Unit (80% CI)"}
            </p>
            <p className="text-gray-100 font-heading">{nextPredScore.toFixed(1)}%</p>
            <p className="text-[10px] text-gray-500">
              {nextLow.toFixed(1)}% - {nextHigh.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dark-border bg-black/35 p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-3">
          <p className="text-[11px] uppercase tracking-widest text-gray-500">
            {locale === "ar"
              ? "أعمدة التغير اليومي في التأثير البصري"
              : "Daily Visual Impact Change Columns"}
          </p>
          <p className="text-xs text-gray-400">
            {locale === "ar" ? "متوسط التغير/يوم" : "Avg change / day"}:{" "}
            <span className="text-gold-300 font-heading">
              {avgDelta >= 0 ? "+" : ""}
              {avgDelta.toFixed(2)}%
            </span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <div
            className="flex items-end gap-1.5 h-36 min-w-[280px]"
            style={{ minWidth: `${Math.max(deltaColumns.length * 18, 280)}px` }}
          >
            {deltaColumns.map((item, index) => {
              const magnitude = Math.abs(item.delta);
              const barHeight = clamp((magnitude / maxAbsDelta) * 100, 0, 100);
              const isPositive = item.delta > 0;
              const isNegative = item.delta < 0;
              const showLabel =
                index === 0 ||
                index === deltaColumns.length - 1 ||
                index % deltaLabelStride === 0;
              return (
                <div
                  key={`${item.unit}-${index}`}
                  className="flex flex-col items-center justify-end gap-1 h-full"
                  title={`${t(locale, labelPrefix === "week" ? "week" : "day")} ${item.unit}: ${
                    item.delta >= 0 ? "+" : ""
                  }${item.delta.toFixed(2)}%`}
                >
                  <span className="text-[10px] text-gray-400 leading-none">
                    {index === 0
                      ? "--"
                      : `${item.delta >= 0 ? "+" : ""}${item.delta.toFixed(1)}`}
                  </span>
                  <div
                    className={`w-3 rounded-sm ${
                      isPositive
                        ? "bg-emerald-400"
                        : isNegative
                        ? "bg-red-400"
                        : "bg-gray-500"
                    }`}
                    style={{ height: `${Math.max(6, barHeight)}%` }}
                  />
                  <span className="text-[9px] text-gray-500 leading-none">
                    {showLabel
                      ? `${labelPrefix === "week" ? "W" : "D"}${item.unit}`
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {bestDelta ? (
          <p className="text-xs text-gray-500 mt-2">
            {locale === "ar"
              ? `أفضل قفزة كانت في ${t(locale, labelPrefix === "week" ? "week" : "day")} ${bestDelta.unit} بقيمة +${bestDelta.delta.toFixed(2)}%.`
              : `Best jump was on ${t(locale, labelPrefix === "week" ? "week" : "day")} ${bestDelta.unit} at +${bestDelta.delta.toFixed(2)}%.`}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-dark-border bg-black/30 p-4">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">
          {locale === "ar" ? "محطات التقدم" : "Progress Milestones"}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {milestones.map((point, index) => {
            const score = toScore(point.impact, scale);
            return (
              <div key={`${point.day}-${index}`} className="rounded-lg border border-dark-border bg-black/40 px-3 py-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {index < 3
                    ? locale === "ar"
                      ? `ربع ${index + 1}`
                      : `Q${index + 1}`
                    : locale === "ar"
                    ? "الحالي"
                    : "Current"}
                </p>
                <p className="text-sm text-gray-100 font-heading">{score.toFixed(1)}%</p>
                <p className="text-[10px] text-gray-500">
                  {t(locale, labelPrefix === "week" ? "week" : "day")} {point.day}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
