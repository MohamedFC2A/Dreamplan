"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { searchProtocol } from "@/app/actions";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto"
      >
        <h1 className="font-heading text-6xl md:text-8xl font-bold text-glow text-cyber-500 tracking-wider mb-4">
          MASCULINE PEAK
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-heading text-xl md:text-2xl text-gray-400 tracking-widest uppercase mb-6"
        >
          The 7-Day Transformation Protocol
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-gray-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed"
        >
          Science-backed bio-hacking protocols engineered for peak masculine physique.
          Describe your goal and unlock your personalized transformation blueprint.
        </motion.p>

        <motion.form
          action={searchProtocol}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 mb-16 max-w-xl mx-auto"
        >
          <input
            type="text"
            name="query"
            placeholder="Describe your dream physique..."
            className="flex-1 bg-dark-card border border-dark-border rounded-lg px-5 py-3.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-cyber-500 hover:bg-cyber-600 text-dark-bg font-heading font-bold tracking-wider px-6 py-3.5 rounded-lg transition-colors uppercase text-sm"
          >
            Generate Protocol
          </button>
        </motion.form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full px-4"
      >
        <Link href="/protocol/hand-veins" className="group">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-cyber-500 transition-all duration-300 group-hover:box-glow">
            <div className="text-4xl mb-4">🩸</div>
            <h3 className="font-heading text-xl font-bold text-gray-100 mb-2 tracking-wide">
              Ultimate Vascularity
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Maximize dorsal venous network visibility through vasodilation, subcutaneous water manipulation & targeted forearm training.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Vasodilation", "NO Boost", "Forearm Pump"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-cyber-500/10 text-cyber-400 border border-cyber-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>

        <Link href="/protocol/ronaldo-neck" className="group">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-cyber-500 transition-all duration-300 group-hover:box-glow">
            <div className="text-4xl mb-4">🗿</div>
            <h3 className="font-heading text-xl font-bold text-gray-100 mb-2 tracking-wide">
              The Ronaldo Neck
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Maximize thyroid cartilage visibility through neck leanness, SCM hypertrophy & postural optimization for a dominant profile.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["SCM Growth", "Posture Fix", "Jawline"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-cyber-500/10 text-cyber-400 border border-cyber-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      </motion.div>
    </main>
  );
}
