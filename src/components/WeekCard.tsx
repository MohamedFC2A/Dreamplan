"use client";

import { useMemo, useState, type ReactNode } from "react";
import { WeekPlan } from "@/lib/protocols";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import {
  ChevronDown,
  ShieldCheck,
  Target,
  CalendarClock,
  CheckCircle2,
  Sunrise,
  UtensilsCrossed,
  Pill,
  Dumbbell,
  Heart,
  Droplets,
  Moon,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, { en: string; ar: string; icon: ReactNode; color: string }> = {
  wake: {
    en: "Wake",
    ar: "استيقاظ",
    icon: <Sunrise className="w-3 h-3" />,
    color: "text-purple-300 border-purple-500/30 bg-purple-500/10",
  },
  meal: {
    en: "Meal",
    ar: "وجبة",
    icon: <UtensilsCrossed className="w-3 h-3" />,
    color: "text-orange-300 border-orange-500/30 bg-orange-500/10",
  },
  supplement: {
    en: "Supplement",
    ar: "مكملات",
    icon: <Pill className="w-3 h-3" />,
    color: "text-pink-300 border-pink-500/30 bg-pink-500/10",
  },
  training: {
    en: "Training",
    ar: "تدريب",
    icon: <Dumbbell className="w-3 h-3" />,
    color: "text-red-300 border-red-500/30 bg-red-500/10",
  },
  recovery: {
    en: "Recovery",
    ar: "تعافي",
    icon: <Heart className="w-3 h-3" />,
    color: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  },
  hydration: {
    en: "Hydration",
    ar: "ترطيب",
    icon: <Droplets className="w-3 h-3" />,
    color: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  },
  sleep: {
    en: "Sleep",
    ar: "نوم",
    icon: <Moon className="w-3 h-3" />,
    color: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10",
  },
};

export default function WeekCard({ week, weekIndex }: { week: WeekPlan; weekIndex: number }) {
  const { locale } = useLanguage();
  const [expanded, setExpanded] = useState(weekIndex === 0);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const title = locale === "ar" ? week.titleAr : week.title;
  const weeklyGoal = locale === "ar" ? week.weeklyGoalAr : week.weeklyGoal;
  const checkpoints = locale === "ar" ? week.checkpointsAr : week.checkpoints;
  const safetyNotes = locale === "ar" ? week.safetyNotesAr : week.safetyNotes;

  const completion = useMemo(() => {
    const total = week.tasks.length;
    const done = week.tasks.filter((task) => checked.has(task.id)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [week.tasks, checked]);

  const toggleTask = (taskId: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full px-5 py-4 flex items-start gap-4 text-start hover:bg-dark-border/20 transition-colors"
      >
        <div className="w-12 h-12 rounded-full border border-gold-500/30 bg-gold-500/10 flex items-center justify-center shrink-0">
          <span className="font-heading text-gold-400 font-bold text-sm">{week.week}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg font-bold text-gray-100">{title}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{weeklyGoal}</p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-gold-500/30 text-gold-400 bg-gold-500/10">
              {t(locale, "week")} {week.week}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-dark-border text-gray-400">
              {completion.done}/{completion.total} {t(locale, "tasks")}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-dark-border text-gray-400">
              {completion.pct}%
            </span>
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="mb-4 p-3 rounded-lg border border-gold-500/20 bg-gold-500/5">
                <p className="text-[10px] uppercase tracking-widest text-gold-400 font-bold mb-1">
                  {t(locale, "weeklyGoalLabel")} <Target className="w-3 h-3 inline" />
                </p>
                <p className="text-sm text-gray-300">{weeklyGoal}</p>
              </div>

              <div className="space-y-2 mb-4">
                {week.tasks.map((task) => {
                  const taskAction = locale === "ar" ? task.actionAr : task.action;
                  const taskWhy = locale === "ar" ? task.scienceWhyAr : task.scienceWhy;
                  const taskTips = locale === "ar" ? task.tipsAr || task.tips : task.tips || task.tipsAr;
                  const taskFrequency = locale === "ar" ? task.frequencyAr : task.frequency;
                  const category = CATEGORY_LABELS[task.category] || CATEGORY_LABELS.recovery;
                  const taskDone = checked.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        taskDone ? "border-gold-500/35 bg-gold-500/10" : "border-dark-border bg-black/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                            taskDone ? "border-gold-500 bg-gold-500/90 text-black" : "border-gray-600 text-transparent"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${category.color}`}>
                              <span className="inline-flex items-center gap-1">
                                {category.icon}
                                {locale === "ar" ? category.ar : category.en}
                              </span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-gold-500/30 text-gold-400 bg-gold-500/10">
                              <CalendarClock className="w-3 h-3 inline ltr:mr-1 rtl:ml-1" />
                              {taskFrequency}
                            </span>
                          </div>
                          <p className={`text-sm ${taskDone ? "text-gray-500 line-through" : "text-gray-200"}`}>
                            {taskAction}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{taskWhy}</p>
                          {taskTips ? <p className="text-xs text-gray-400 mt-1">{taskTips}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Array.isArray(checkpoints) && checkpoints.length > 0 ? (
                <div className="mb-3 p-3 rounded-lg border border-dark-border bg-black/30">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
                    {t(locale, "weeklyCheckpoints")}
                  </p>
                  <ul className="space-y-1">
                    {checkpoints.map((checkpoint, index) => (
                      <li key={`${checkpoint}-${index}`} className="text-xs text-gray-400">
                        - {checkpoint}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {Array.isArray(safetyNotes) && safetyNotes.length > 0 ? (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                  <p className="text-[10px] uppercase tracking-widest text-red-300 font-bold mb-2">
                    {t(locale, "weeklySafetyNotes")} <ShieldCheck className="w-3 h-3 inline" />
                  </p>
                  <ul className="space-y-1">
                    {safetyNotes.map((note, index) => (
                      <li key={`${note}-${index}`} className="text-xs text-red-200">
                        - {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
