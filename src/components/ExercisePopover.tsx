"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

interface ExercisePopoverProps {
  exerciseName: string;
  exerciseNameAr: string;
  tips?: string;
  tipsAr?: string;
}

const exerciseGuides: Record<string, { steps: string[]; stepsAr: string[] }> = {
  "grip": {
    steps: [
      "Hold a hand gripper or tennis ball firmly",
      "Squeeze for 3-5 seconds, release slowly",
      "Perform 3 sets of 20-30 reps",
      "Focus on full range of motion",
      "Rest 60 seconds between sets"
    ],
    stepsAr: [
      "أمسك قابض اليد أو كرة تنس بإحكام",
      "اضغط لمدة 3-5 ثوانٍ، ثم حرر ببطء",
      "نفذ 3 مجموعات من 20-30 تكرار",
      "ركز على المدى الكامل للحركة",
      "استرح 60 ثانية بين المجموعات"
    ]
  },
  "neck": {
    steps: [
      "Lie face down on a bench with head hanging off",
      "Place weight plate on back of head (start light)",
      "Lift head up by extending neck, hold 2 seconds",
      "Lower slowly and repeat for 12-15 reps",
      "Perform 3-4 sets with controlled form"
    ],
    stepsAr: [
      "استلقِ على وجهك على مقعد مع تعليق الرأس من الحافة",
      "ضع لوح وزن على مؤخرة الرأس (ابدأ بوزن خفيف)",
      "ارفع رأسك بمد الرقبة، ثبت لمدة ثانيتين",
      "أنزل ببطء وكرر لـ 12-15 تكرار",
      "نفذ 3-4 مجموعات مع تحكم في الأداء"
    ]
  },
  "chin-tuck": {
    steps: [
      "Stand with back against wall",
      "Pull chin straight back (make a double chin)",
      "Hold for 5-10 seconds",
      "Release and repeat 15-20 times",
      "Do 3 sets throughout the day"
    ],
    stepsAr: [
      "قف بظهرك ملاصقاً للحائط",
      "اسحب ذقنك للخلف بشكل مستقيم",
      "ثبت لمدة 5-10 ثوانٍ",
      "حرر وكرر 15-20 مرة",
      "نفذ 3 مجموعات خلال اليوم"
    ]
  },
};

function getGuide(action: string): { steps: string[]; stepsAr: string[] } | null {
  const lower = action.toLowerCase();
  if (lower.includes("grip") || lower.includes("forearm") || lower.includes("wrist")) return exerciseGuides["grip"];
  if (lower.includes("neck curl") || lower.includes("neck ext") || lower.includes("lateral neck")) return exerciseGuides["neck"];
  if (lower.includes("chin tuck") || lower.includes("posture") || lower.includes("mewing")) return exerciseGuides["chin-tuck"];
  return null;
}

export default function ExercisePopover({ exerciseName, exerciseNameAr, tips, tipsAr }: ExercisePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { locale } = useLanguage();
  const guide = getGuide(exerciseName);

  if (!guide && !tips) return null;

  const steps = locale === "ar" ? guide?.stepsAr : guide?.steps;
  const currentTips = locale === "ar" ? tipsAr : tips;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-[10px] px-2 py-0.5 rounded border border-gold-500/30 text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 transition-colors cursor-pointer"
      >
        {t(locale, "viewExercise")} 💪
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-72 p-4 rounded-xl bg-dark-card border border-gold-500/30 shadow-xl shadow-black/30 ltr:left-0 rtl:right-0 top-8"
            >
              <h4 className="font-heading text-sm font-bold text-gold-400 mb-3 tracking-wide">
                {locale === "ar" ? exerciseNameAr : exerciseName}
              </h4>

              {steps && (
                <ol className="space-y-2 mb-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-300">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {currentTips && (
                <div className="mt-2 p-2 rounded-lg bg-dark-bg/50 border border-dark-border/50">
                  <span className="text-[10px] text-yellow-400 font-bold uppercase">
                    {t(locale, "tips")} 💡
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{currentTips}</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
