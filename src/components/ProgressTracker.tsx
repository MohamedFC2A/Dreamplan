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
const MAX_IMPACT = 35;

function getX(day: number): number {
  return PADDING.left + ((day - 1) / 6) * PLOT_WIDTH;
}

function getY(impact: number): number {
  return PADDING.top + PLOT_HEIGHT - (impact / MAX_IMPACT) * PLOT_HEIGHT;
}

export default function ProgressTracker({ data }: { data: ProgressPoint[] }) {
  const { locale } = useLanguage();
  const sorted = [...data].sort((a, b) => a.day - b.day);

  const linePath = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(p.day)} ${getY(p.impact)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${getX(sorted[sorted.length - 1].day)} ${PADDING.top + PLOT_HEIGHT}` +
    ` L ${getX(sorted[0].day)} ${PADDING.top + PLOT_HEIGHT} Z`;

  const yTicks = [0, 10, 20, 30];

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

        {yTicks.map((val) => (
          <g key={val}>
            <line x1={PADDING.left} y1={getY(val)} x2={PADDING.left + PLOT_WIDTH} y2={getY(val)} stroke="#1a1a1a" strokeWidth="1" />
            <text x={PADDING.left - 8} y={getY(val) + 4} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif">
              {val}%
            </text>
          </g>
        ))}

        {sorted.map((p) => (
          <text key={p.day} x={getX(p.day)} y={PADDING.top + PLOT_HEIGHT + 18} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif">
            {t(locale, "day")} {p.day}
          </text>
        ))}

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
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {sorted.map((p, i) => (
          <motion.g key={p.day} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 * i + 0.5, duration: 0.3 }}>
            <circle cx={getX(p.day)} cy={getY(p.impact)} r="4" fill="#000000" stroke="#D4AF37" strokeWidth="2" />
            <text x={getX(p.day)} y={getY(p.impact) - 10} textAnchor="middle" fill="#D4AF37" fontSize="9" fontWeight="bold" fontFamily="Inter">
              {p.impact}%
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
