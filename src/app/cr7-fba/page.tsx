"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { cr7BodyParts } from "@/data/cr7-fba";
import type { LucideIcon } from "lucide-react";
import {
  Scan,
  Activity,
  Mountain,
  Shield,
  Dumbbell,
  Droplets,
  Target,
  Triangle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Scan,
  Activity,
  Mountain,
  Shield,
  Dumbbell,
  Droplets,
  Target,
  Triangle,
};

function BodyPartCard({
  part,
  index,
  locale,
  isActive,
  onHover,
  onLeave,
}: {
  part: (typeof cr7BodyParts)[number];
  index: number;
  locale: string;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAr = locale === "ar";
  const Icon = iconMap[part.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative border rounded-xl p-4 transition-all duration-300 ${
        isActive
          ? "border-gold-500 bg-gold-500/5 shadow-lg shadow-gold-500/10"
          : "border-dark-border bg-dark-card/60 hover:border-dark-border/80"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold-500 text-black text-xs font-bold shrink-0">
          {index + 1}
        </span>
        {Icon && <Icon className="w-4 h-4 text-gold-500 shrink-0" />}
        <h3 className="font-heading text-gold-400 text-sm font-semibold tracking-wide">
          {isAr ? part.titleAr : part.titleEn}
        </h3>
      </div>

      <p className="text-gray-400 text-xs leading-relaxed mb-3">
        {isAr ? part.descriptionAr : part.descriptionEn}
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-gold-500/70 hover:text-gold-500 text-xs transition-colors"
      >
        {isAr
          ? expanded
            ? "إخفاء"
            : "كيف تحقق ذلك؟"
          : expanded
            ? "Hide"
            : "How to Achieve"}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-dark-border">
              <p className="text-gray-300 text-xs leading-relaxed">
                {isAr ? part.howToAr : part.howToEn}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {part.protocolLink && (
        <Link
          href={part.protocolLink}
          className="inline-flex items-center gap-1 mt-3 text-xs bg-gold-500/10 text-gold-400 border border-gold-500/30 rounded-full px-3 py-1.5 hover:bg-gold-500/20 transition-colors"
        >
          <ArrowUpRight className="w-3 h-3" />
          {isAr ? part.protocolLabelAr : part.protocolLabelEn}
        </Link>
      )}
    </motion.div>
  );
}

export default function CR7FBAPage() {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const [activeId, setActiveId] = useState<string | null>(null);

  const leftParts = cr7BodyParts.filter((p) => p.side === "left");
  const rightParts = cr7BodyParts.filter((p) => p.side === "right");

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-24 pb-8 px-4 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white tracking-wider mb-2">
            CR7 <span className="text-gold-500">FBA</span>
          </h1>
          <p className="font-heading text-sm md:text-base text-gold-500/80 tracking-[0.2em] uppercase mb-6">
            {isAr
              ? "تحليل جسم كريستيانو رونالدو الكامل"
              : "CRISTIANO RONALDO FULL BODY ANALYSIS"}
          </p>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            {isAr
              ? "تحليل علمي مفصّل لكل جزء من جسم رونالدو. اضغط على أي نقطة مرقّمة لاستكشاف التفاصيل."
              : "A detailed scientific analysis of Ronaldo's physique. Hover over any numbered point to explore the details."}
          </p>
        </motion.div>
      </div>

      <div className="hidden md:grid grid-cols-[1fr_380px_1fr] gap-8 max-w-7xl mx-auto px-8 pb-16">
        <div className="flex flex-col gap-4 justify-center">
          {leftParts.map((part) => (
            <BodyPartCard
              key={part.id}
              part={part}
              index={cr7BodyParts.indexOf(part)}
              locale={locale}
              isActive={activeId === part.id}
              onHover={() => setActiveId(part.id)}
              onLeave={() => setActiveId(null)}
            />
          ))}
        </div>

        <div className="relative">
          <Image
            src="/images/cr7-fullbody.png"
            alt="Cristiano Ronaldo Full Body"
            width={380}
            height={660}
            className="object-contain w-full h-auto"
            priority
          />
          {cr7BodyParts.map((part, i) => (
            <div
              key={part.id}
              className="absolute z-10 cursor-pointer"
              style={{
                top: `${part.position.top}%`,
                left: `${part.position.left}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() => setActiveId(part.id)}
              onMouseLeave={() => setActiveId(null)}
              onClick={() =>
                setActiveId(activeId === part.id ? null : part.id)
              }
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300 ${
                  activeId === part.id
                    ? "bg-gold-500 text-black scale-125 shadow-lg shadow-gold-500/50"
                    : "bg-gold-500/80 text-black hover:bg-gold-500"
                }`}
              >
                {i + 1}
              </span>
              {activeId === part.id && (
                <span className="absolute inset-0 w-6 h-6 rounded-full bg-gold-500/30 animate-ping" />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 justify-center">
          {rightParts.map((part) => (
            <BodyPartCard
              key={part.id}
              part={part}
              index={cr7BodyParts.indexOf(part)}
              locale={locale}
              isActive={activeId === part.id}
              onHover={() => setActiveId(part.id)}
              onLeave={() => setActiveId(null)}
            />
          ))}
        </div>
      </div>

      <div className="md:hidden px-4 pb-16">
        <div className="relative max-w-sm mx-auto mb-8">
          <Image
            src="/images/cr7-fullbody.png"
            alt="Cristiano Ronaldo Full Body"
            width={380}
            height={660}
            className="object-contain w-full h-auto"
            priority
          />
          {cr7BodyParts.map((part, i) => (
            <div
              key={part.id}
              className="absolute z-10"
              style={{
                top: `${part.position.top}%`,
                left: `${part.position.left}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() =>
                setActiveId(activeId === part.id ? null : part.id)
              }
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-all duration-300 ${
                  activeId === part.id
                    ? "bg-gold-500 text-black scale-125 shadow-lg shadow-gold-500/50"
                    : "bg-gold-500/80 text-black"
                }`}
              >
                {i + 1}
              </span>
              {activeId === part.id && (
                <span className="absolute inset-0 w-5 h-5 rounded-full bg-gold-500/30 animate-ping" />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          {cr7BodyParts.map((part, i) => (
            <BodyPartCard
              key={part.id}
              part={part}
              index={i}
              locale={locale}
              isActive={activeId === part.id}
              onHover={() => setActiveId(part.id)}
              onLeave={() => setActiveId(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
