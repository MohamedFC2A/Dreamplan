"use client";

import { ProgressPoint } from "@/lib/protocols";
import { motion } from "framer-motion";

const CHART_WIDTH = 500;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 45 };
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
  const sorted = [...data].sort((a, b) => a.day - b.day);

  const linePath = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(p.day)} ${getY(p.impact)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${getX(sorted[sorted.length - 1].day)} ${PADDING.top + PLOT_HEIGHT}` +
    ` L ${getX(sorted[0].day)} ${PADDING.top + PLOT_HEIGHT} Z`;

  const yTicks = [0, 10, 20, 30];
  const gridLines = yTicks.map((val) => getY(val));

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-10">
      <h2 className="font-heading text-lg font-bold text-gray-200 mb-4 tracking-wide uppercase">
        Projected Visual Impact
      </h2>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={PADDING.left}
            y1={y}
            x2={PADDING.left + PLOT_WIDTH}
            y2={y}
            stroke="#1e1e2e"
            strokeWidth="1"
          />
        ))}

        {yTicks.map((val, i) => (
          <text
            key={i}
            x={PADDING.left - 8}
            y={getY(val) + 4}
            textAnchor="end"
            className="fill-gray-500"
            fontSize="9"
            fontFamily="Inter, sans-serif"
          >
            {val}%
          </text>
        ))}

        {sorted.map((p) => (
          <text
            key={p.day}
            x={getX(p.day)}
            y={PADDING.top + PLOT_HEIGHT + 18}
            textAnchor="middle"
            className="fill-gray-500"
            fontSize="9"
            fontFamily="Inter, sans-serif"
          >
            Day {p.day}
          </text>
        ))}

        <path d={areaPath} fill="url(#areaGradient)" />

        <motion.path
          d={linePath}
          fill="none"
          stroke="#00f0ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {sorted.map((p, i) => (
          <motion.circle
            key={p.day}
            cx={getX(p.day)}
            cy={getY(p.impact)}
            r="4"
            fill="#0a0a0f"
            stroke="#00f0ff"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 * i + 0.5, duration: 0.3 }}
          />
        ))}
      </svg>
    </div>
  );
}
