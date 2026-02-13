"use client";

import { Protocol } from "@/lib/protocols";
import { motion } from "framer-motion";
import Link from "next/link";
import ProgressTracker from "@/components/ProgressTracker";
import DayCard from "@/components/DayCard";

export default function ProtocolDashboard({
  protocol,
}: {
  protocol: Protocol;
}) {
  return (
    <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/"
          className="text-cyber-400 hover:text-cyber-300 text-sm font-medium mb-8 inline-block transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-100 mb-2 tracking-wide text-glow-sm">
          {protocol.title}
        </h1>
        <p className="text-gray-500 text-lg mb-8">{protocol.subtitle}</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {protocol.focus.map((f) => (
            <span
              key={f}
              className="text-xs px-3 py-1.5 rounded-full bg-cyber-500/10 text-cyber-400 border border-cyber-500/20"
            >
              {f}
            </span>
          ))}
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-10">
          <h2 className="font-heading text-lg font-bold text-gray-200 mb-3 tracking-wide uppercase">
            Science Overview
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {protocol.scienceOverview}
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
