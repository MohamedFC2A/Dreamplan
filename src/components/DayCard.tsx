"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayPlan } from "@/lib/protocols";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import Popover from "@/components/Popover";
import ExercisePopover from "@/components/ExercisePopover";

const categoryConfig: Record<string, { color: string; icon: string; labelEn: string; labelAr: string }> = {
  wake: { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: "🌅", labelEn: "Wake", labelAr: "استيقاظ" },
  meal: { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: "🍽️", labelEn: "Meal", labelAr: "وجبة" },
  supplement: { color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: "💊", labelEn: "Supplement", labelAr: "مكمل" },
  training: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: "🏋️", labelEn: "Training", labelAr: "تمرين" },
  recovery: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: "🧊", labelEn: "Recovery", labelAr: "تعافي" },
  hydration: { color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: "💧", labelEn: "Hydration", labelAr: "ترطيب" },
  sleep: { color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: "🌙", labelEn: "Sleep", labelAr: "نوم" },
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
  const { locale } = useLanguage();

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const totalTasks = day.tasks.length;
  const completedCount = day.tasks.filter((task) => completedTasks.has(task.id)).length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const dayTitle = locale === "ar" ? day.titleAr : day.title;
  const dayTheme = locale === "ar" ? day.themeAr : day.theme;
  const dailyGoal = locale === "ar" ? day.dailyGoalAr : day.dailyGoal;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-start hover:bg-dark-border/20 transition-colors"
        aria-expanded={expanded}
      >
        <span className="font-heading text-3xl font-bold text-cyber-500 shrink-0 w-12 text-center">
          {String(day.day).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-xl font-bold text-gray-100 tracking-wide">
            {dayTitle}
          </h3>
          <span className="text-xs text-cyber-400 uppercase tracking-widest">
            {dayTheme}
          </span>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-dark-border overflow-hidden max-w-[200px]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyber-500 to-cyber-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
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
          transition={{ duration: 0.2 }}
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
            <div className="px-5 pb-5">
              {dailyGoal && (
                <div className="mb-4 p-3 rounded-lg bg-cyber-500/5 border border-cyber-500/20">
                  <span className="text-[10px] text-cyber-400 font-bold uppercase tracking-wider">
                    {t(locale, "dailyGoal")} 🎯
                  </span>
                  <p className="text-sm text-gray-300 mt-1">{dailyGoal}</p>
                </div>
              )}

              <div className="space-y-2">
                {day.tasks.map((task, i) => {
                  const isCompleted = completedTasks.has(task.id);
                  const cat = categoryConfig[task.category] || categoryConfig.wake;
                  const taskAction = locale === "ar" ? task.actionAr : task.action;
                  const taskScience = locale === "ar" ? task.scienceWhyAr : task.scienceWhy;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: locale === "ar" ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex gap-3 p-3 rounded-lg border transition-all duration-300 ${
                        isCompleted
                          ? "bg-cyber-500/5 border-cyber-500/30"
                          : "bg-dark-bg/50 border-dark-border/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                          isCompleted
                            ? "border-cyber-500 bg-cyber-500 text-dark-bg"
                            : "border-gray-600 hover:border-cyber-500/50"
                        }`}
                      >
                        {isCompleted && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

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
                              <span className="text-[10px] px-2 py-0.5 rounded border border-cyber-500/30 text-cyber-400 bg-cyber-500/10 hover:bg-cyber-500/20 transition-colors cursor-pointer">
                                {t(locale, "whyThis")} 🔬
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
                                  {t(locale, "tips")} 💡
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
