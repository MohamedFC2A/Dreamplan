"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayPlan } from "@/lib/protocols";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import Popover from "@/components/Popover";
import ExercisePopover from "@/components/ExercisePopover";
import { Sunrise, UtensilsCrossed, Pill, Dumbbell, Heart, Droplets, Moon, Target, FlaskConical, Lightbulb, Trophy } from "lucide-react";

const categoryConfig: Record<string, { color: string; icon: React.ReactNode; labelEn: string; labelAr: string }> = {
  wake: { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: <Sunrise className="w-3.5 h-3.5" />, labelEn: "Wake", labelAr: "استيقاظ" },
  meal: { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: <UtensilsCrossed className="w-3.5 h-3.5" />, labelEn: "Meal", labelAr: "وجبة" },
  supplement: { color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: <Pill className="w-3.5 h-3.5" />, labelEn: "Supplement", labelAr: "مكمل" },
  training: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: <Dumbbell className="w-3.5 h-3.5" />, labelEn: "Training", labelAr: "تمرين" },
  recovery: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <Heart className="w-3.5 h-3.5" />, labelEn: "Recovery", labelAr: "تعافي" },
  hydration: { color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: <Droplets className="w-3.5 h-3.5" />, labelEn: "Hydration", labelAr: "ترطيب" },
  sleep: { color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: <Moon className="w-3.5 h-3.5" />, labelEn: "Sleep", labelAr: "نوم" },
};

function ImpactBar({ level, locale }: { level: "low" | "medium" | "high"; locale: string }) {
  const widths = { low: "w-1/4", medium: "w-1/2", high: "w-3/4" };
  const colors = { low: "bg-gray-500", medium: "bg-yellow-400", high: "bg-green-400" };
  const labels = locale === "ar"
    ? { low: "منخفض", medium: "متوسط", high: "عالي" }
    : { low: "Low", medium: "Med", high: "High" };
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-dark-border overflow-hidden">
        <div className={`h-full rounded-full ${colors[level]} ${widths[level]}`} />
      </div>
      <span className={`text-[9px] uppercase font-bold ${level === "high" ? "text-green-400" : level === "medium" ? "text-yellow-400" : "text-gray-500"}`}>
        {labels[level]}
      </span>
    </div>
  );
}

export default function DayCard({
  day,
  dayIndex,
}: {
  day: DayPlan;
  dayIndex: number;
}) {
  const [expanded, setExpanded] = useState(dayIndex === 0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const { locale } = useLanguage();

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
        setJustCompleted(null);
      } else {
        next.add(taskId);
        setJustCompleted(taskId);
        setTimeout(() => setJustCompleted(null), 800);
      }
      return next;
    });
  };

  const totalTasks = day.tasks.length;
  const completedCount = day.tasks.filter((task) => completedTasks.has(task.id)).length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  const isAllComplete = totalTasks > 0 && completedCount === totalTasks;

  const dayTitle = locale === "ar" ? day.titleAr : day.title;
  const dayTheme = locale === "ar" ? day.themeAr : day.theme;
  const dailyGoal = locale === "ar" ? day.dailyGoalAr : day.dailyGoal;

  return (
    <div
      className={`bg-dark-card border border-dark-border rounded-xl overflow-hidden transition-all duration-300 ux-card ${
        expanded
          ? locale === "ar"
            ? "border-r-2 border-r-gold-500/60"
            : "border-l-2 border-l-gold-500/60"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 text-start hover:bg-dark-border/20 transition-colors"
        aria-expanded={expanded}
      >
        <span className="font-heading text-2xl sm:text-3xl font-bold text-gold-500 shrink-0 w-10 sm:w-12 text-center">
          {String(day.day).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg sm:text-xl font-bold text-gray-100 tracking-wide">
            {dayTitle}
          </h3>
          <span className="text-xs text-gold-400 uppercase tracking-widest">
            {dayTheme}
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className={`w-full sm:w-auto flex-1 h-2 rounded-full bg-dark-border overflow-hidden sm:max-w-[200px] transition-shadow duration-500 ${
              isAllComplete ? "shadow-[0_0_8px_rgba(212,175,55,0.6)]" : ""
            }`}>
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 ${
                  isAllComplete ? "shadow-[0_0_6px_rgba(212,175,55,0.8)]" : ""
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {Math.round(progressPercent)}%
            </span>
            <span className="text-xs text-gray-500">
              {completedCount}/{totalTasks} {t(locale, "tasks")}
            </span>
          </div>
        </div>
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-gray-500 shrink-0"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
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
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <AnimatePresence>
                {isAllComplete && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="mb-4 p-3 rounded-lg bg-gold-500/10 border border-gold-500/40 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5 text-gold-400" />
                    <span className="text-sm font-bold text-gold-400 tracking-wide">
                      {locale === "ar" ? "اليوم مكتمل!" : "Day Complete!"}
                    </span>
                    <Trophy className="w-5 h-5 text-gold-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              {dailyGoal && (
                <div className="mb-4 p-3 rounded-lg bg-gold-500/5 border border-gold-500/20">
                  <span className="text-[10px] text-gold-400 font-bold uppercase tracking-wider">
                    {t(locale, "dailyGoal")} <Target className="w-3 h-3 text-gold-400 inline" />
                  </span>
                  <p className="text-sm text-gray-300 mt-1">{dailyGoal}</p>
                </div>
              )}

              <div className="space-y-2">
                {day.tasks.map((task, i) => {
                  const isCompleted = completedTasks.has(task.id);
                  const isJustCompleted = justCompleted === task.id;
                  const cat = categoryConfig[task.category] || categoryConfig.wake;
                  const taskAction = locale === "ar" ? task.actionAr : task.action;
                  const taskScience = locale === "ar" ? task.scienceWhyAr : task.scienceWhy;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: locale === "ar" ? 10 : -10 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        backgroundColor: isJustCompleted
                          ? ["rgba(212,175,55,0.15)", "rgba(212,175,55,0.05)", "rgba(212,175,55,0.02)"]
                          : undefined,
                      }}
                      transition={{
                        delay: i * 0.05,
                        backgroundColor: { duration: 0.8, ease: "easeOut" },
                      }}
                      className={`flex gap-3 p-3 rounded-lg border transition-all duration-300 ${
                        isCompleted
                          ? "bg-gold-500/5 border-gold-500/30"
                          : "bg-dark-bg/50 border-dark-border/50"
                      }`}
                    >
                      <motion.button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        animate={isJustCompleted ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                          isCompleted
                            ? "border-gold-500 bg-gold-500 text-black"
                            : "border-gray-600 hover:border-gold-500/50"
                        }`}
                      >
                        {isCompleted && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </motion.button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${cat.color}`}>
                            {cat.icon} {locale === "ar" ? cat.labelAr : cat.labelEn}
                          </span>
                          <ImpactBar level={task.visualImpact} locale={locale} />
                        </div>

                        <p className={`text-sm mb-1.5 transition-all ${isCompleted ? "text-gray-500 line-through" : "text-gray-200"}`}>
                          {taskAction}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Popover
                            title={t(locale, "scienceExplanation")}
                            trigger={
                              <span className="text-[10px] px-2 py-0.5 rounded border border-gold-500/30 text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 transition-colors cursor-pointer">
                                {t(locale, "whyThis")} <FlaskConical className="w-3 h-3 text-gold-400 inline" />
                              </span>
                            }
                          >
                            <p>{taskScience}</p>
                          </Popover>

                          {task.category === "training" && (
                            <ExercisePopover
                              exerciseName={task.action}
                              exerciseNameAr={task.actionAr}
                              tips={task.tips}
                              tipsAr={task.tipsAr}
                            />
                          )}

                          {task.tips && task.category !== "training" && (
                            <Popover
                              title={t(locale, "tips")}
                              trigger={
                                <span className="text-[10px] px-2 py-0.5 rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors cursor-pointer">
                                  {t(locale, "tips")} <Lightbulb className="w-3 h-3 text-yellow-400 inline" />
                                </span>
                              }
                            >
                              <p>{locale === "ar" ? task.tipsAr : task.tips}</p>
                            </Popover>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
