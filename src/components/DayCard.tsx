"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayPlan } from "@/lib/protocols";
import ScienceTooltip from "@/components/ScienceTooltip";

const categoryColors: Record<string, string> = {
  wake: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  meal: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  supplement: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  training: "text-red-400 bg-red-500/10 border-red-500/20",
  recovery: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  hydration: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  sleep: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

function ImpactDot({ level }: { level: "low" | "medium" | "high" }) {
  const color =
    level === "high"
      ? "bg-green-400"
      : level === "medium"
      ? "bg-yellow-400"
      : "bg-gray-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function DayCard({
  day,
  dayIndex,
}: {
  day: DayPlan;
  dayIndex: number;
}) {
  const [expanded, setExpanded] = useState(dayIndex === 0);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-dark-border/20 transition-colors"
        aria-expanded={expanded}
      >
        <span className="font-heading text-3xl font-bold text-cyber-500 shrink-0 w-12 text-center">
          {String(day.day).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-xl font-bold text-gray-100 tracking-wide">
            {day.title}
          </h3>
          <span className="text-xs text-cyber-400 uppercase tracking-widest">
            {day.theme}
          </span>
        </div>
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-gray-500 shrink-0"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2">
              {day.schedule.map((entry, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-lg bg-dark-bg/50 border border-dark-border/50"
                >
                  <div className="shrink-0 w-16 text-xs font-mono text-cyber-400 pt-0.5">
                    {entry.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                          categoryColors[entry.category] ||
                          "text-gray-400 bg-gray-500/10 border-gray-500/20"
                        }`}
                      >
                        {entry.category}
                      </span>
                      <ImpactDot level={entry.visualImpact} />
                    </div>
                    <p className="text-gray-200 text-sm">
                      {entry.action}
                      <ScienceTooltip text={entry.scienceWhy} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
