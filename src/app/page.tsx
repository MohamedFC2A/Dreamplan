"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { PenLine, Bot, TrendingUp, Droplets, Skull, Zap, Crown, ArrowDown, ChevronDown, ArrowLeft, Sparkles, X, Calendar, Search, BookOpen, ListChecks, FileText, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const EXAMPLES_AR = [
  "أريد عروق بارزة في يدي وساعدي خلال 14 يوم",
  "أريد رقبة قوية مثل كريستيانو رونالدو في 7 أيام",
  "خطة لخسارة 5 كيلو من الدهون في 30 يوم",
  "أريد عضلات بطن مقسمة سكس باك خلال 21 يوم",
  "أريد أكتاف عريضة وشكل V في 14 يوم",
  "خطة تضخيم الذراعين في 30 يوم",
  "أريد فك حاد ووجه منحوت خلال 21 يوم",
];

const EXAMPLES_EN = [
  "I want visible hand and forearm veins in 14 days",
  "Build a strong Ronaldo-like neck in 7 days",
  "Lose 5kg of body fat in 30 days",
  "Get shredded six pack abs in 21 days",
  "Wide shoulders and V-taper in 14 days",
  "Bulk up my arms in 30 days",
  "Sharp jawline and sculpted face in 21 days",
];


function useTypewriter(
  examples: string[],
  options?: { typeSpeed?: number; deleteSpeed?: number; pauseTime?: number; deletePause?: number }
) {
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const typeSpeed = options?.typeSpeed ?? 60;
  const deleteSpeed = options?.deleteSpeed ?? 30;
  const pauseTime = options?.pauseTime ?? 2000;
  const deletePause = options?.deletePause ?? 500;

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!isActive || examples.length === 0) {
      clear();
      return;
    }

    let cancelled = false;

    async function run() {
      while (!cancelled && isActiveRef.current) {
        const currentExample = examples[indexRef.current % examples.length];

        for (let i = 0; i <= currentExample.length; i++) {
          if (cancelled || !isActiveRef.current) return;
          setText(currentExample.slice(0, i));
          await new Promise((r) => {
            timeoutRef.current = setTimeout(r, typeSpeed + Math.random() * 30);
          });
        }

        if (cancelled || !isActiveRef.current) return;
        await new Promise((r) => {
          timeoutRef.current = setTimeout(r, pauseTime);
        });

        for (let i = currentExample.length; i >= 0; i--) {
          if (cancelled || !isActiveRef.current) return;
          setText(currentExample.slice(0, i));
          await new Promise((r) => {
            timeoutRef.current = setTimeout(r, deleteSpeed);
          });
        }

        if (cancelled || !isActiveRef.current) return;
        await new Promise((r) => {
          timeoutRef.current = setTimeout(r, deletePause);
        });

        indexRef.current = (indexRef.current + 1) % examples.length;
      }
    }

    run();

    return () => {
      cancelled = true;
      clear();
    };
  }, [isActive, examples, typeSpeed, deleteSpeed, pauseTime, deletePause, clear]);

  return {
    text,
    isActive,
    pause: () => {
      setIsActive(false);
      setText("");
    },
    resume: () => setIsActive(true),
  };
}

function detectDuration(query: string): number | null {
  const patterns = [
    { regex: /(\d+)\s*(?:day|days|يوم|أيام|ايام)/i, multiplier: 1 },
    { regex: /(\d+)\s*(?:week|weeks|اسبوع|أسبوع|أسابيع|اسابيع)/i, multiplier: 7 },
    { regex: /(\d+)\s*(?:month|months|شهر|أشهر|اشهر)/i, multiplier: 30 },
  ];

  for (const { regex, multiplier } of patterns) {
    const match = query.match(regex);
    if (match) {
      return parseInt(match[1], 10) * multiplier;
    }
  }
  return null;
}

function validateDuration(days: number): { valid: boolean; errorKey?: "tooShort" | "tooLong" } {
  if (days < 7) return { valid: false, errorKey: "tooShort" };
  if (days > 90) return { valid: false, errorKey: "tooLong" };
  return { valid: true };
}

const DURATION_OPTIONS = [
  { days: 7, noteKey: "quickStart" as const },
  { days: 14, noteKey: "recommended" as const },
  { days: 21, noteKey: "visibleResults" as const },
  { days: 30, noteKey: "fullTransform" as const },
  { days: 60, noteKey: "deepChange" as const },
  { days: 90, noteKey: "maxResults" as const },
];

function DurationModal({
  isOpen,
  onSelect,
  onClose,
  locale,
  errorMessage,
}: {
  isOpen: boolean;
  onSelect: (days: number) => void;
  onClose: () => void;
  locale: "ar" | "en";
  errorMessage?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-[#0a0a0a] border border-gold-500/30 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl shadow-gold-500/10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gold-400" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white tracking-wide">
                {t(locale, "durationQuestion")}
              </h3>
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {errorMessage}
              </motion.div>
            )}

            <p className="text-gray-500 text-sm mb-6">
              {t(locale, "durationNote")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {DURATION_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.days}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(opt.days)}
                  className="group relative bg-black border border-dark-border hover:border-gold-500/50 rounded-xl p-4 text-start transition-all"
                >
                  <div className="font-heading text-2xl font-bold text-gold-500 mb-1">
                    {opt.days}
                  </div>
                  <div className="text-gray-300 text-sm font-medium">
                    {locale === "ar" ? `${opt.days} ${opt.days === 7 ? "أيام" : "يوم"}` : `${opt.days} Days`}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    {t(locale, opt.noteKey)}
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const INLINE_STEPS = [
  { key: "planStep1" as const, icon: Search },
  { key: "planStep2" as const, icon: BookOpen },
  { key: "planStep3" as const, icon: ListChecks },
  { key: "planStep4" as const, icon: FileText },
  { key: "planStep5" as const, icon: CheckCircle },
];

function InlinePlanningProgress({ locale, userGoal }: { locale: "ar" | "en"; userGoal: string }) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let step = 0;
    const stepDurations = [2000, 3000, 4000, 3000, 0];
    const totalStepTime = stepDurations.reduce((a, b) => a + b, 0);
    let startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const baseProgress = Math.min((elapsed / totalStepTime) * 85, 85);
      setProgress(baseProgress);

      let accumulated = 0;
      for (let i = 0; i < stepDurations.length; i++) {
        accumulated += stepDurations[i];
        if (elapsed < accumulated) {
          setActiveStep(i);
          break;
        }
        if (i === stepDurations.length - 1) {
          setActiveStep(i);
        }
      }

      if (baseProgress < 85) {
        progressRef.current = setTimeout(tick, 100);
      } else {
        const crawl = () => {
          setProgress((prev) => {
            if (prev >= 95) return prev;
            return prev + 0.1;
          });
          progressRef.current = setTimeout(crawl, 500);
        };
        crawl();
      }
    };

    progressRef.current = setTimeout(tick, 100);
    return () => {
      if (progressRef.current) clearTimeout(progressRef.current);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Bot className="w-5 h-5 text-gold-400 animate-pulse" />
        <h3 className="font-heading text-lg md:text-xl font-bold text-white tracking-wide">
          {t(locale, "planningTitle")}
        </h3>
      </div>

      <div className="mb-5 px-4 py-3 rounded-xl bg-gold-500/5 border border-gold-500/15">
        <span className="text-[10px] text-gold-400 font-bold uppercase tracking-widest">{t(locale, "planningYourGoal")}</span>
        <p className="text-gray-300 text-sm mt-0.5 leading-relaxed truncate">{userGoal}</p>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t(locale, "planningProgress")}</span>
          <span className="text-[10px] text-gold-400 font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-[#111] rounded-full overflow-hidden border border-dark-border">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #D4AF37, #f5d76e, #D4AF37)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {INLINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          const isCompleted = activeStep > index;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * index }}
              className="flex-1 relative"
            >
              <div className={`flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg transition-all duration-500 ${
                isActive ? "bg-gold-500/10" : ""
              }`}>
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? "bg-gold-500/20"
                    : isActive
                    ? "bg-gold-500/15 ring-2 ring-gold-500/30"
                    : "bg-[#111]"
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-gold-400" />
                  ) : (
                    <Icon className={`w-4 h-4 transition-colors duration-500 ${isActive ? "text-gold-400" : "text-gray-700"}`} />
                  )}
                </div>
                <span className={`text-[9px] md:text-[10px] font-bold text-center leading-tight transition-colors duration-500 ${
                  isCompleted ? "text-gold-400/70" : isActive ? "text-gold-400" : "text-gray-700"
                }`}>
                  {t(locale, step.key)}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
              {index < INLINE_STEPS.length - 1 && (
                <div className={`absolute top-[18px] md:top-[20px] -right-1 md:-right-1.5 w-2 md:w-3 h-px transition-colors duration-500 ${
                  isCompleted ? "bg-gold-500/40" : "bg-[#1a1a1a]"
                }`} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [durationError, setDurationError] = useState("");
  const [pendingQuery, setPendingQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showPlanning, setShowPlanning] = useState(false);

  const examples = locale === "ar" ? EXAMPLES_AR : EXAMPLES_EN;

  const typewriter = useTypewriter(examples);

  const callApi = async (finalQuery: string) => {
    setIsLoading(true);
    setShowPlanning(true);
    setError("");
    setShowDurationModal(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: finalQuery.trim(), locale }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate protocol");
      }

      const protocol = await res.json();
      if (protocol.error) throw new Error(protocol.error);

      sessionStorage.setItem("ai-protocol", JSON.stringify(protocol));
      router.push("/protocol/ai-generated");
    } catch (err: any) {
      setShowPlanning(false);
      setError(err.message || t(locale, "errorDesc"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const duration = detectDuration(query);

    if (duration === null) {
      setPendingQuery(query.trim());
      setDurationError("");
      setShowDurationModal(true);
      return;
    }

    const validation = validateDuration(duration);
    if (!validation.valid) {
      setPendingQuery(query.trim());
      setDurationError(validation.errorKey ? t(locale, validation.errorKey) : "");
      setShowDurationModal(true);
      return;
    }

    await callApi(query);
  };

  const handleDurationSelect = async (days: number) => {
    const durationSuffix = locale === "ar"
      ? ` خلال ${days} يوم`
      : ` in ${days} days`;

    const durationDetected = detectDuration(pendingQuery);
    let finalQuery = pendingQuery;

    if (durationDetected === null) {
      finalQuery = pendingQuery + durationSuffix;
    } else {
      finalQuery = pendingQuery.replace(
        /\d+\s*(?:day|days|يوم|أيام|ايام|week|weeks|اسبوع|أسبوع|أسابيع|اسابيع|month|months|شهر|أشهر|اشهر)/i,
        `${days} ${locale === "ar" ? "يوم" : "days"}`
      );
    }

    setQuery(finalQuery);
    setShowDurationModal(false);
    await callApi(finalQuery);
  };

  const handleFocus = () => {
    typewriter.pause();
  };

  const handleBlur = () => {
    if (!query.trim()) {
      typewriter.resume();
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0" />

        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 flex items-end justify-end z-[1]"
        >
          <div className="relative w-[60%] md:w-[45%] h-[75vh] md:h-[90vh] ltr:mr-[5%] rtl:ml-[5%]" style={{direction: "ltr"}}>
            <Image
              src="/images/ronaldo-nassr.png"
              alt="Cristiano Ronaldo"
              fill
              className="object-contain object-bottom"
              priority
              sizes="(max-width: 768px) 60vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-[2]" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-8 py-20">
          <div className="flex items-center min-h-[80vh]">
            <div className="relative z-20 w-full md:w-1/2">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/15 border border-gold-500/30">
                <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                <span className="text-xs text-gold-400 font-bold tracking-wider uppercase">
                  {t(locale, "aiPowered")}
                </span>
              </div>

              {locale === "ar" ? (
                <>
                  <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-wider mb-2 leading-tight">
                    ذروة <span className="text-gold-500">الرجولة</span>
                  </h1>
                  <p className="font-heading text-lg md:text-xl text-gray-500 tracking-widest mb-4">
                    MASCULINE PEAK
                  </p>
                </>
              ) : (
                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-wider mb-4 leading-tight">
                  MASCULINE <span className="text-gold-500">PEAK</span>
                </h1>
              )}

              <p className="font-heading text-xl md:text-2xl text-gold-400/80 tracking-widest uppercase mb-4">
                {t(locale, "tagline")}
              </p>

              <p className="text-gray-400 text-base md:text-lg mb-8 max-w-lg leading-relaxed">
                {t(locale, "heroDescription")}
              </p>

              <div className="flex items-center gap-6 mb-8">
                {[
                  { value: "7-90", label: locale === "ar" ? "يوم" : "Days" },
                  { value: "70+", label: locale === "ar" ? "مهمة" : "Tasks" },
                  { value: "AI", label: locale === "ar" ? "مدعوم" : "Powered" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center">
                    <div className="text-center">
                      <div className="font-heading text-2xl md:text-3xl font-bold text-gold-500">{stat.value}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                    {i < 2 && <div className="w-1 h-1 rounded-full bg-gold-500/40 ltr:ml-6 rtl:mr-6" />}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => document.getElementById("protocol-form")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-heading font-bold tracking-wider px-6 py-3 rounded-xl transition-all uppercase text-sm active:scale-[0.98] shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30"
                >
                  <ArrowDown className="w-4 h-4" />
                  {locale === "ar" ? "ابدأ الآن" : "Start Now"}
                </button>
                <Link
                  href="/plans"
                  className="inline-flex items-center gap-2 border border-gold-500/50 text-gold-400 hover:bg-gold-500/10 font-heading font-bold tracking-wider px-6 py-3 rounded-xl transition-all uppercase text-sm active:scale-[0.98]"
                >
                  <Crown className="w-4 h-4" />
                  {locale === "ar" ? "عرض الخطط" : "View Plans"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-gold-500/50" />
        </motion.div>
      </section>

      <section id="protocol-form" className="relative z-10 px-4 py-16 max-w-5xl mx-auto w-full -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="animated-border-wrapper mb-16"
        >
          <div className="animated-border-inner p-8 md:p-10">
            {showPlanning ? (
              <InlinePlanningProgress locale={locale} userGoal={query} />
            ) : (
              <>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gold-400" />
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-white text-center tracking-wide">
                    {t(locale, "designProtocol")}
                  </h2>
                </div>
                <p className="text-gray-500 text-center mb-8 text-sm">
                  {t(locale, "designProtocolDesc")}
                </p>

                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        rows={3}
                        className="w-full bg-black border border-dark-border rounded-xl px-5 py-4 text-gray-100 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors resize-none text-base placeholder-transparent"
                        disabled={isLoading}
                      />
                      {!query && typewriter.isActive && (
                        <div className="absolute top-0 left-0 right-0 px-5 py-4 pointer-events-none text-gray-600 text-base">
                          {typewriter.text}
                          <span className="inline-block w-[2px] h-[1.1em] bg-gold-500/60 align-middle animate-pulse ml-[1px]" />
                        </div>
                      )}
                      {!query && !typewriter.isActive && (
                        <div className="absolute top-0 left-0 right-0 px-5 py-4 pointer-events-none text-gray-600 text-base">
                          {t(locale, "searchPlaceholder")}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !query.trim()}
                      className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-heading font-bold tracking-wider px-8 py-4 rounded-xl transition-all uppercase text-sm"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                          </svg>
                          {t(locale, "loading")}
                        </span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {t(locale, "generateBtn")}
                        </>
                      )}
                    </button>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </form>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-200 text-center mb-4 tracking-wide">
            {t(locale, "howItWorks")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative">
            <div className="hidden md:block absolute top-7 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
            {[
              { num: "01", title: t(locale, "step1Title"), desc: t(locale, "step1Desc"), icon: <PenLine className="w-6 h-6 text-gold-400" /> },
              { num: "02", title: t(locale, "step2Title"), desc: t(locale, "step2Desc"), icon: <Bot className="w-6 h-6 text-gold-400" /> },
              { num: "03", title: t(locale, "step3Title"), desc: t(locale, "step3Desc"), icon: <TrendingUp className="w-6 h-6 text-gold-400" /> },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-dark-card border border-dark-border rounded-xl p-6 text-center relative z-10"
              >
                <div className="w-14 h-14 rounded-full bg-gold-500/10 flex items-center justify-center mx-auto mb-4">{step.icon}</div>
                <span className="text-gold-500 font-heading text-sm font-bold">{step.num}</span>
                <h3 className="font-heading text-lg font-bold text-gray-100 mt-1 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-200 text-center mb-8 tracking-wide">
            {t(locale, "featuredProtocols")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/protocol/hand-veins" className="group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-gold-500/50 transition-all duration-300 h-full"
              >
                <div className="flex items-start gap-4">
                  <Droplets className="w-8 h-8 text-red-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-xl font-bold text-gray-100 mb-2 tracking-wide">
                      {t(locale, "vascularity")}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      {t(locale, "vascularityDesc")}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[t(locale, "vasodilation"), t(locale, "noBoost"), t(locale, "forearmPump")].map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-gold-500/60 group-hover:text-gold-400 transition-colors text-xs">
                      <span>{locale === "ar" ? "عرض البروتوكول" : "View Protocol"}</span>
                      <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href="/protocol/ronaldo-neck" className="group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-gold-500/50 transition-all duration-300 h-full"
              >
                <div className="flex items-start gap-4">
                  <Skull className="w-8 h-8 text-gray-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-xl font-bold text-gray-100 mb-2 tracking-wide">
                      {t(locale, "ronaldoNeck")}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      {t(locale, "ronaldoNeckDesc")}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[t(locale, "scmGrowth"), t(locale, "postureFix"), t(locale, "jawline")].map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-gold-500/60 group-hover:text-gold-400 transition-colors text-xs">
                      <span>{locale === "ar" ? "عرض البروتوكول" : "View Protocol"}</span>
                      <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-12 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-dark-card border border-gold-500/30 rounded-2xl p-8 md:p-10 text-center"
        >
          <Crown className="w-10 h-10 text-gold-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide">
            {locale === "ar" ? "اكتشف خطة PRO للوصول غير المحدود" : "Unlock unlimited access with PRO"}
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            {locale === "ar" ? "احصل على بروتوكولات حصرية ودعم متقدم بالذكاء الاصطناعي" : "Get exclusive protocols and advanced AI support"}
          </p>
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-heading font-bold tracking-wider px-8 py-3 rounded-xl transition-all uppercase text-sm"
          >
            <Crown className="w-4 h-4" />
            {locale === "ar" ? "عرض الخطط" : "View Plans"}
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 border-t border-dark-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <Link href="/" className="font-heading text-sm font-bold text-white tracking-widest">
              MASCULINE <span className="text-gold-500">PEAK</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-gold-400 transition-colors">
                {locale === "ar" ? "الرئيسية" : "Home"}
              </Link>
              <Link href="/plans" className="text-sm text-gray-500 hover:text-gold-400 transition-colors">
                {locale === "ar" ? "الاشتراكات" : "Plans"}
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-gray-600 text-xs flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-gold-400 inline" />
              {locale === "ar"
                ? "مدعوم بالذكاء الاصطناعي DeepSeek — جميع البروتوكولات مبنية على أسس علمية"
                : "Powered by DeepSeek AI — All protocols are scientifically grounded"}
            </p>
            <p className="text-gray-600 text-xs">
              {locale === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"} &copy; {new Date().getFullYear()} Masculine Peak
            </p>
          </div>
        </div>
      </footer>

      <DurationModal
        isOpen={showDurationModal}
        onSelect={handleDurationSelect}
        onClose={() => setShowDurationModal(false)}
        locale={locale}
        errorMessage={durationError}
      />

    </main>
  );
}
