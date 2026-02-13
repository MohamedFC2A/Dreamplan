"use client";

import { ProgressPoint } from "@/lib/protocols";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

const CHART_WIDTH = 500;
const CHART_HEIGHT = 200;
const PADDING = { top: 25, right: 20, bottom: 35, left: 45 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

function getX(index: number, totalPoints: number): number {
  if (totalPoints <= 1) return PADDING.left + PLOT_WIDTH / 2;
  return PADDING.left + (index / (totalPoints - 1)) * PLOT_WIDTH;
}

function getY(impact: number, maxImpact: number): number {
  if (maxImpact <= 0) return PADDING.top + PLOT_HEIGHT;
  return PADDING.top + PLOT_HEIGHT - (impact / maxImpact) * PLOT_HEIGHT;
}

function buildTicks(maxImpact: number): number[] {
  const top = Math.max(30, Math.ceil(maxImpact / 5) * 5);
  return [0, Math.round(top / 3), Math.round((2 * top) / 3), top];
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
  const yTicks = buildTicks(maxImpact);

  const linePath = sorted
    .map((point, index) => `${index === 0 ? "M" : "L"} ${getX(index, sorted.length)} ${getY(point.impact, maxImpact)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${getX(sorted.length - 1, sorted.length)} ${PADDING.top + PLOT_HEIGHT}` +
    ` L ${getX(0, sorted.length)} ${PADDING.top + PLOT_HEIGHT} Z`;

  const labelStride = sorted.length <= 10 ? 1 : sorted.length <= 20 ? 2 : sorted.length <= 40 ? 4 : 7;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8">
      <h2 className="font-heading text-lg font-bold text-gray-200 mb-4 tracking-wide uppercase">
        {t(locale, "projectedImpact")}
      </h2>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              y1={getY(tick, maxImpact)}
              x2={PADDING.left + PLOT_WIDTH}
              y2={getY(tick, maxImpact)}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 8}
              y={getY(tick, maxImpact) + 4}
              textAnchor="end"
              fill="#64748b"
              fontSize="9"
              fontFamily="Inter, sans-serif"
            >
              {tick}%
            </text>
          </g>
        ))}

        {sorted.map((point, index) => {
          const showLabel = index === 0 || index === sorted.length - 1 || index % labelStride === 0;
          if (!showLabel) return null;
          return (
            <text
              key={`label-${point.day}-${index}`}
              x={getX(index, sorted.length)}
              y={PADDING.top + PLOT_HEIGHT + 18}
              textAnchor="middle"
              fill="#64748b"
              fontSize="9"
              fontFamily="Inter, sans-serif"
            >
              {t(locale, labelPrefix === "week" ? "week" : "day")} {point.day}
            </text>
          );
        })}

        <path d={areaPath} fill="url(#areaGradient)" />

        <motion.path
          d={linePath}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {sorted.map((point, index) => (
          <motion.g
            key={`${point.day}-${index}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.04 * index + 0.2, duration: 0.2 }}
          >
            <circle
              cx={getX(index, sorted.length)}
              cy={getY(point.impact, maxImpact)}
              r="3.6"
              fill="#000000"
              stroke="#D4AF37"
              strokeWidth="1.8"
            />
            {sorted.length <= 18 && (
              <text
                x={getX(index, sorted.length)}
                y={getY(point.impact, maxImpact) - 9}
                textAnchor="middle"
                fill="#D4AF37"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="Inter"
              >
                {point.impact}%
              </text>
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
