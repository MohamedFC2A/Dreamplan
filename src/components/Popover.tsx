"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function Popover({ trigger, children, title, className = "" }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onFocus={() => setIsOpen(true)}
        className="inline-flex items-center"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-72 md:w-80 p-4 rounded-xl bg-dark-card border border-cyber-500/30 shadow-2xl shadow-cyber-500/10 ltr:left-0 rtl:right-0 top-8"
          >
            {title && (
              <h4 className="font-heading text-sm font-bold text-cyber-400 mb-2 tracking-wide uppercase">
                {title}
              </h4>
            )}
            <div className="text-xs text-gray-400 leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
