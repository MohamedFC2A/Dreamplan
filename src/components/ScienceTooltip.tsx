"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScienceTooltip({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="inline-block relative align-middle">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-cyber-500/40 text-cyber-400 hover:text-cyber-300 hover:border-cyber-400 transition-colors cursor-pointer ml-1"
        aria-label="Science explanation"
        aria-expanded={isOpen}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1.5-4.5c-.5.3-.5.5-.5.8v.7H7v-.7c0-1 .5-1.5 1.2-2 .5-.3.8-.6.8-1.1 0-.7-.5-1.2-1-1.2s-1 .4-1.1 1H5.4c.1-1.5 1.2-2.5 2.6-2.5s2.5 1.1 2.5 2.5c0 1-.6 1.6-1 1.9z"
            fill="currentColor"
          />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 top-6 w-64 p-3 rounded-lg bg-dark-bg border border-cyber-500/20 shadow-lg"
          >
            <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
