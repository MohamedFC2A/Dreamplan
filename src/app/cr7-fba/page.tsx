"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { cr7BodyParts, BodyPart } from "@/data/cr7-fba";
import {
  Scan,
  Activity,
  Mountain,
  Shield,
  Dumbbell,
  Droplets,
  Target,
  Triangle,
  Flame,
  Zap,
  Footprints,
  Percent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Scan,
  Activity,
  Mountain,
  Shield,
  Dumbbell,
  Droplets,
  Target,
  Triangle,
  Flame,
  Zap,
  Footprints,
  Percent,
};

function BodyPartCard({
  part,
  index,
  locale,
  isHighlighted,
  onHover,
  onLeave,
  cardRef,
}: {
  part: BodyPart;
  index: number;
  locale: string;
  isHighlighted: boolean;
  onHover: () => void;
  onLeave: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAr = locale === "ar";
  const IconComponent = iconMap[part.icon];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: part.side === "left" ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative border rounded-lg p-4 transition-all duration-300 cursor-pointer ${
        isHighlighted
          ? "border-gold-500 bg-gold-500/10"
          : "border-dark-border bg-dark-card/80 hover:border-gold-500/40"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="md:hidden flex items-center justify-center w-6 h-6 rounded-full bg-gold-500 text-black text-xs font-bold flex-shrink-0">
          {index + 1}
        </span>
        {IconComponent && (
          <IconComponent className="text-gold-500 flex-shrink-0" size={20} />
        )}
        <h3 className="font-heading text-gold-500 text-sm font-semibold tracking-wide uppercase">
          {isAr ? part.titleAr : part.titleEn}
        </h3>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed mb-2">
        {isAr ? part.descriptionAr : part.descriptionEn}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex items-center gap-1 text-gold-500/70 hover:text-gold-500 text-xs transition-colors"
      >
        {isAr ? (expanded ? "إخفاء" : "كيف تحقق ذلك؟") : expanded ? "Hide" : "How to Achieve"}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 pt-3 border-t border-dark-border"
        >
          <p className="text-gray-300 text-xs leading-relaxed">
            {isAr ? part.howToAr : part.howToEn}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function CR7FBAPage() {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<
    { x1: number; y1: number; x2: number; y2: number; id: string }[]
  >([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const leftParts = cr7BodyParts.filter((p) => p.side === "left");
  const rightParts = cr7BodyParts.filter((p) => p.side === "right");

  const calculateLines = useCallback(() => {
    if (!imageContainerRef.current || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const newLines: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];

    cr7BodyParts.forEach((part) => {
      const dot = document.getElementById(`dot-${part.id}`);
      const card = cardRefs.current[part.id];
      if (!dot || !card) return;

      const dotRect = dot.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      const x1 = dotRect.left + dotRect.width / 2 - svgRect.left;
      const y1 = dotRect.top + dotRect.height / 2 - svgRect.top;

      const x2 =
        part.side === "left"
          ? cardRect.right - svgRect.left
          : cardRect.left - svgRect.left;
      const y2 = cardRect.top + cardRect.height / 2 - svgRect.top;

      newLines.push({ x1, y1, x2, y2, id: part.id });
    });

    setLines(newLines);
  }, []);

  useEffect(() => {
    const timer = setTimeout(calculateLines, 500);
    window.addEventListener("resize", calculateLines);
    window.addEventListener("scroll", calculateLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateLines);
      window.removeEventListener("scroll", calculateLines);
    };
  }, [calculateLines]);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
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
              ? "تحليل علمي مفصّل لكل جزء من جسم كريستيانو رونالدو - ما الذي يجعله مميزاً، وكيف يمكنك تحقيق نفس النتائج من خلال التدريب والتغذية المستهدفة."
              : "A detailed scientific analysis of every part of Cristiano Ronaldo's physique - what makes each feature exceptional, and how you can achieve the same results through targeted training and nutrition."}
          </p>
        </motion.div>

        {/* Desktop Layout */}
        <div className="hidden md:block relative max-w-7xl mx-auto">
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ overflow: "visible" }}
          >
            {lines.map((line) => (
              <line
                key={line.id}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={hoveredId === line.id ? "#D4AF37" : "#D4AF3744"}
                strokeWidth={hoveredId === line.id ? 1.5 : 0.8}
                strokeDasharray={hoveredId === line.id ? "none" : "4 4"}
                className="transition-all duration-300"
              />
            ))}
          </svg>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-start">
            {/* Left Cards */}
            <div className="flex flex-col gap-4 pt-8">
              {leftParts.map((part, i) => (
                <BodyPartCard
                  key={part.id}
                  part={part}
                  index={cr7BodyParts.indexOf(part)}
                  locale={locale}
                  isHighlighted={hoveredId === part.id}
                  onHover={() => setHoveredId(part.id)}
                  onLeave={() => setHoveredId(null)}
                  cardRef={(el) => {
                    cardRefs.current[part.id] = el;
                  }}
                />
              ))}
            </div>

            {/* Center Image */}
            <div
              ref={imageContainerRef}
              className="relative flex-shrink-0"
              style={{ width: 340 }}
            >
              <div className="relative">
                <Image
                  src="/images/cr7-fullbody.png"
                  alt="Cristiano Ronaldo Full Body"
                  width={340}
                  height={680}
                  className="object-contain w-auto h-auto"
                  priority
                  onLoad={() => setTimeout(calculateLines, 100)}
                />
                {cr7BodyParts.map((part, index) => (
                  <div
                    key={part.id}
                    id={`dot-${part.id}`}
                    className="absolute z-20 cursor-pointer group"
                    style={{
                      top: `${part.position.top}%`,
                      left: `${part.position.left}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => setHoveredId(part.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <span
                      className={`block w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                        hoveredId === part.id
                          ? "bg-gold-500 border-gold-300 scale-150"
                          : "bg-gold-500/70 border-gold-500"
                      }`}
                    />
                    <span
                      className={`absolute inset-0 w-3 h-3 rounded-full bg-gold-500/40 animate-ping ${
                        hoveredId === part.id ? "opacity-100" : "opacity-50"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Cards */}
            <div className="flex flex-col gap-4 pt-8">
              {rightParts.map((part, i) => (
                <BodyPartCard
                  key={part.id}
                  part={part}
                  index={cr7BodyParts.indexOf(part)}
                  locale={locale}
                  isHighlighted={hoveredId === part.id}
                  onHover={() => setHoveredId(part.id)}
                  onLeave={() => setHoveredId(null)}
                  cardRef={(el) => {
                    cardRefs.current[part.id] = el;
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden max-w-md mx-auto">
          <div className="relative mb-8">
            <Image
              src="/images/cr7-fullbody.png"
              alt="Cristiano Ronaldo Full Body"
              width={400}
              height={800}
              className="object-contain mx-auto"
              priority
            />
            {cr7BodyParts.map((part, index) => (
              <div
                key={part.id}
                className="absolute z-20"
                style={{
                  top: `${part.position.top}%`,
                  left: `${part.position.left}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold-500 text-black text-[10px] font-bold">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {cr7BodyParts.map((part, index) => (
              <BodyPartCard
                key={part.id}
                part={part}
                index={index}
                locale={locale}
                isHighlighted={hoveredId === part.id}
                onHover={() => setHoveredId(part.id)}
                onLeave={() => setHoveredId(null)}
                cardRef={(el) => {
                  cardRefs.current[part.id] = el;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
