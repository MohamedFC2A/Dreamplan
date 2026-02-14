"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import {
  PenLine,
  Bot,
  TrendingUp,
  Droplets,
  Skull,
  Zap,
  Crown,
  ArrowDown,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Search,
  BookOpen,
  ListChecks,
  FileText,
  CheckCircle,
  Trash2,
  SlidersHorizontal,
  Clock3,
  PencilLine,
  Save,
  ClipboardList,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  PrivateProtocolEntry,
  deletePrivateProtocol,
  getPrivateProtocols,
  migrateLegacySavedProtocols,
  openPrivateProtocolEntry,
  renamePrivateProtocol,
  clearPrivateProtocols,
} from "@/lib/protocol-storage";
import { PlannerAnswer, PlannerQuestion, UserProfile } from "@/lib/planner-types";
import {
  createDefaultProfile,
  readStoredProfile,
  validateProfile,
} from "@/lib/profile-storage";
import { getProAccessState } from "@/lib/pro-access";
import {
  getGenerationTaskSnapshot,
  getLatestPrivateProtocols,
  resetGenerationTask,
  startGenerationTask,
  subscribeGenerationTask,
} from "@/lib/generation-task";

const EXAMPLES_AR = [
  "أريد عروق بارزة في يدي وساعدي",
  "أريد رقبة قوية مثل كريستيانو رونالدو",
  "خطة لخسارة 5 كيلو من الدهون",
  "أريد عضلات بطن مقسمة سكس باك",
  "أريد أكتاف عريضة وشكل V",
  "خطة تضخيم الذراعين",
  "أريد فك حاد ووجه منحوت",
];

const EXAMPLES_EN = [
  "I want visible hand and forearm veins",
  "Build a strong Ronaldo-like neck",
  "Lose 5kg of body fat",
  "Get shredded six pack abs",
  "Wide shoulders and V-taper physique",
  "Bulk up my arms significantly",
  "Sharp jawline and sculpted face",
];

type FlowState = "goal_input" | "duration_confirm" | "plan_qa" | "generating";
type SortMode = "newest" | "oldest";
type GoalType = "quick_visual" | "fat_loss" | "muscle_gain" | "posture_definition" | "general";
type DurationInputMode = "ai" | "custom";

interface DurationSuggestion {
  suggestedDays: number;
  minDays: number;
  maxDays: number;
  planModeHint?: "daily" | "weekly";
  rationale: string;
  question: string;
  goalType: GoalType;
  quickOptions?: number[];
}

interface PlannerAskResponse {
  status: "ask";
  nextQuestion: PlannerQuestion;
  progress: number;
  reasoningHint: string;
}

interface PlannerReadyResponse {
  status: "ready";
  progress: number;
  planBrief: string;
  keyConstraints: string[];
  profileFitSummary: string;
}

function normalizeDurationSuggestion(payload: any): DurationSuggestion | null {
  if (!payload || typeof payload !== "object") return null;

  const goalType =
    payload.goalType === "quick_visual" ||
    payload.goalType === "fat_loss" ||
    payload.goalType === "muscle_gain" ||
    payload.goalType === "posture_definition" ||
    payload.goalType === "general"
      ? payload.goalType
      : null;

  const suggestedDays = Number.isFinite(payload.suggestedDays) ? Math.round(payload.suggestedDays) : NaN;
  const minDays = Number.isFinite(payload.minDays) ? Math.round(payload.minDays) : NaN;
  const maxDays = Number.isFinite(payload.maxDays) ? Math.round(payload.maxDays) : NaN;

  if (!goalType || !Number.isFinite(suggestedDays) || !Number.isFinite(minDays) || !Number.isFinite(maxDays)) {
    return null;
  }
  if (minDays > maxDays || minDays < 7 || maxDays > 90) return null;

  return {
    goalType,
    suggestedDays: Math.max(minDays, Math.min(maxDays, suggestedDays)),
    minDays,
    maxDays,
    planModeHint: payload.planModeHint === "weekly" ? "weekly" : "daily",
    rationale: typeof payload.rationale === "string" ? payload.rationale : "",
    question: typeof payload.question === "string" ? payload.question : "",
    quickOptions: Array.isArray(payload.quickOptions)
      ? payload.quickOptions
          .map((item: unknown) => (Number.isFinite(item as number) ? Math.round(item as number) : NaN))
          .filter((item: number) => Number.isFinite(item) && item >= minDays && item <= maxDays)
      : undefined,
  };
}

function mapGenerateError(locale: "ar" | "en", code?: string, fallback?: string): string {
  if (code === "AI_TIMEOUT") return t(locale, "errorTimeout");
  if (code === "AI_PROVIDER_ERROR") return t(locale, "errorProvider");
  if (code === "AI_MALFORMED_RESPONSE") return t(locale, "errorMalformed");
  if (code === "INVALID_DURATION") return t(locale, "errorInvalidDuration");
  if (code === "MISSING_PROFILE") return t(locale, "profileValidationSummary");
  return fallback || t(locale, "errorDesc");
}

function mapPlannerError(locale: "ar" | "en", code?: string, fallback?: string): string {
  if (code === "MISSING_PROFILE") return t(locale, "profileRequiredBeforePlan");
  if (code === "INVALID_DURATION") return t(locale, "errorInvalidDuration");
  if (code === "MISSING_QUERY") return locale === "ar" ? "اكتب الهدف أولًا." : "Please enter your goal first.";
  return fallback || t(locale, "errorDesc");
}

function formatDateByLocale(iso: string, locale: "ar" | "en"): string {
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const PLANNER_QA_KEY = "planner-qa.v1";
const PLANNER_SESSION_KEY = "planner-session.v1";


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
  const [planModeEnabled, setPlanModeEnabled] = useState(false);
  const [hasProDemo, setHasProDemo] = useState(false);
  const [flowState, setFlowState] = useState<FlowState>("goal_input");
  const [durationSuggestion, setDurationSuggestion] = useState<DurationSuggestion | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(14);
  const [durationInputMode, setDurationInputMode] = useState<DurationInputMode>("ai");
  const [profile, setProfile] = useState<UserProfile>(createDefaultProfile(""));
  const [qaHistory, setQaHistory] = useState<PlannerAnswer[]>([]);
  const [plannerQuestion, setPlannerQuestion] = useState<PlannerQuestion | null>(null);
  const [plannerProgress, setPlannerProgress] = useState(0);
  const [plannerReasoningHint, setPlannerReasoningHint] = useState("");
  const [plannerReady, setPlannerReady] = useState<PlannerReadyResponse | null>(null);
  const [plannerAnswerValue, setPlannerAnswerValue] = useState("");

  const [privateProtocols, setPrivateProtocols] = useState<PrivateProtocolEntry[]>([]);
  const [privateSearch, setPrivateSearch] = useState("");
  const [privateSort, setPrivateSort] = useState<SortMode>("newest");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const examples = locale === "ar" ? EXAMPLES_AR : EXAMPLES_EN;

  const typewriter = useTypewriter(examples);

  useEffect(() => {
    const migrated = migrateLegacySavedProtocols();
    setPrivateProtocols(migrated.length > 0 ? migrated : getPrivateProtocols());
  }, []);

  useEffect(() => {
    try {
      const proState = getProAccessState();
      setHasProDemo(proState.enabled);
      if (proState.enabled) {
        setPlanModeEnabled(true);
      }

      const stored = readStoredProfile();
      if (stored) setProfile(stored);

      const rawSession = localStorage.getItem(PLANNER_SESSION_KEY);
      if (rawSession) {
        const parsedSession = JSON.parse(rawSession);
        if (parsedSession && typeof parsedSession === "object") {
          if (typeof parsedSession.query === "string") setQuery(parsedSession.query);
          if (parsedSession.durationSuggestion && typeof parsedSession.durationSuggestion === "object") {
            const normalizedSuggestion = normalizeDurationSuggestion(parsedSession.durationSuggestion);
            if (normalizedSuggestion) setDurationSuggestion(normalizedSuggestion);
          }
          if (Number.isFinite(parsedSession.selectedDuration)) {
            setSelectedDuration(Math.round(Number(parsedSession.selectedDuration)));
          }
          if (parsedSession.durationInputMode === "custom" || parsedSession.durationInputMode === "ai") {
            setDurationInputMode(parsedSession.durationInputMode);
          }
          if (typeof parsedSession.planModeEnabled === "boolean") {
            setPlanModeEnabled(parsedSession.planModeEnabled && proState.enabled);
          }
          if (
            parsedSession.flowState === "goal_input" ||
            parsedSession.flowState === "duration_confirm" ||
            parsedSession.flowState === "plan_qa" ||
            parsedSession.flowState === "generating"
          ) {
            setFlowState(parsedSession.flowState);
          }
          if (parsedSession.plannerQuestion && typeof parsedSession.plannerQuestion === "object") {
            setPlannerQuestion(parsedSession.plannerQuestion as PlannerQuestion);
          }
          if (parsedSession.plannerReady && typeof parsedSession.plannerReady === "object") {
            setPlannerReady(parsedSession.plannerReady as PlannerReadyResponse);
          }
          if (typeof parsedSession.plannerReasoningHint === "string") {
            setPlannerReasoningHint(parsedSession.plannerReasoningHint);
          }
          if (Number.isFinite(parsedSession.plannerProgress)) {
            setPlannerProgress(Math.max(0, Math.min(100, Math.round(Number(parsedSession.plannerProgress)))));
          }
        }
      }

      const rawQa = localStorage.getItem(PLANNER_QA_KEY);
      if (rawQa) {
        const parsed = JSON.parse(rawQa);
        if (Array.isArray(parsed?.qaHistory)) {
          setQaHistory(
            parsed.qaHistory
              .map((entry: any) => ({
                questionId: typeof entry?.questionId === "string" ? entry.questionId : "",
                value: typeof entry?.value === "string" ? entry.value : "",
                label: typeof entry?.label === "string" ? entry.label : undefined,
              }))
              .filter((entry: PlannerAnswer) => entry.questionId && entry.value)
          );
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const syncProfile = () => {
      const latest = readStoredProfile();
      if (latest) setProfile(latest);
    };
    window.addEventListener("focus", syncProfile);
    return () => window.removeEventListener("focus", syncProfile);
  }, []);

  useEffect(() => {
    const syncPro = () => {
      const enabled = getProAccessState().enabled;
      setHasProDemo(enabled);
      if (!enabled) setPlanModeEnabled(false);
    };
    syncPro();
    window.addEventListener("storage", syncPro);
    window.addEventListener("focus", syncPro);
    return () => {
      window.removeEventListener("storage", syncPro);
      window.removeEventListener("focus", syncPro);
    };
  }, []);

  useEffect(() => {
    try {
      const qaPayload = { query: query.trim(), durationDays: selectedDuration, qaHistory };
      localStorage.setItem(PLANNER_QA_KEY, JSON.stringify(qaPayload));
      localStorage.setItem(
        PLANNER_SESSION_KEY,
        JSON.stringify({
          query: query.trim(),
          flowState,
          durationSuggestion,
          selectedDuration,
          durationInputMode,
          qaHistory,
          plannerQuestion,
          plannerProgress,
          plannerReasoningHint,
          plannerReady,
          planModeEnabled,
        })
      );
    } catch {}
  }, [
    qaHistory,
    selectedDuration,
    query,
    flowState,
    durationSuggestion,
    durationInputMode,
    plannerQuestion,
    plannerProgress,
    plannerReasoningHint,
    plannerReady,
    planModeEnabled,
  ]);

  useEffect(() => {
    const initial = getGenerationTaskSnapshot();
    if (initial.status === "running") {
      setFlowState("generating");
      setIsLoading(true);
      if (initial.query) setQuery(initial.query);
    } else if (initial.status === "success") {
      setPrivateProtocols(getLatestPrivateProtocols());
    }

    const unsubscribe = subscribeGenerationTask((next) => {
      if (next.status === "running") {
        setFlowState("generating");
        setIsLoading(true);
        setError("");
        if (next.query) setQuery(next.query);
        return;
      }
      if (next.status === "success") {
        setPrivateProtocols(getLatestPrivateProtocols());
        setIsLoading(false);
        setError("");
        resetGenerationTask();
        router.push("/protocol/ai-generated");
        return;
      }
      if (next.status === "error") {
        setIsLoading(false);
        setFlowState(planModeEnabled ? "plan_qa" : "goal_input");
        setError(mapGenerateError(locale, next.code || undefined, next.error || undefined));
        resetGenerationTask();
      }
    });

    return () => unsubscribe();
  }, [locale, planModeEnabled, router]);

  useEffect(() => {
    if (flowState !== "generating") return;
    if (getGenerationTaskSnapshot().status === "running") return;
    setIsLoading(false);
    setFlowState(durationSuggestion ? "duration_confirm" : "goal_input");
  }, [flowState, durationSuggestion]);

  const filteredPrivateProtocols = useMemo(() => {
    const needle = privateSearch.trim().toLowerCase();
    const list = [...privateProtocols];

    const filtered = needle
      ? list.filter((entry) => {
          const fields = [
            entry.customName || "",
            entry.title || "",
            entry.titleAr || "",
            entry.subtitle || "",
            entry.subtitleAr || "",
          ]
            .join(" ")
            .toLowerCase();
          return fields.includes(needle);
        })
      : list;

    filtered.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return privateSort === "newest" ? bTime - aTime : aTime - bTime;
    });

    return filtered;
  }, [privateProtocols, privateSearch, privateSort]);
  const profileValidationErrors = useMemo(() => validateProfile(profile, locale), [profile, locale]);
  const canStartPlanQuestions = profileValidationErrors.length === 0;

  const loadPrivateProtocol = (entry: PrivateProtocolEntry) => {
    openPrivateProtocolEntry(entry);
    router.push("/protocol/ai-generated");
  };

  const removePrivateProtocol = (id: string) => {
    const updated = deletePrivateProtocol(id);
    setPrivateProtocols(updated);
    if (renameId === id) {
      setRenameId(null);
      setRenameValue("");
    }
  };

  const clearAllPrivate = () => {
    if (!window.confirm(t(locale, "privateDeleteAllConfirm"))) return;
    const updated = clearPrivateProtocols();
    setPrivateProtocols(updated);
    setRenameId(null);
    setRenameValue("");
  };

  const saveCustomProtocolName = (id: string) => {
    const updated = renamePrivateProtocol(id, renameValue);
    setPrivateProtocols(updated);
    setRenameId(null);
    setRenameValue("");
  };

  const preparePlanningProfile = useCallback(
    (source: UserProfile): UserProfile => ({
      ...source,
      units: "metric",
      primaryGoal: query.trim() || source.primaryGoal || "",
      injuriesOrConditions: source.injuriesOrConditions?.trim() || "none",
      availableEquipment: source.availableEquipment?.trim() || "bodyweight",
    }),
    [query]
  );

  const requestDurationSuggestion = async (finalQuery: string) => {
    setIsLoading(true);
    setError("");
    setPlannerQuestion(null);
    setPlannerReady(null);
    setPlannerReasoningHint("");
    setPlannerProgress(0);
    setQaHistory([]);

    try {
      const res = await fetch("/api/suggest-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: finalQuery.trim(), locale }),
      });

      if (!res.ok) {
        let serverError = "";
        try {
          const payload = await res.json();
          serverError = payload?.error || "";
        } catch {}
        throw new Error(serverError || t(locale, "errorSuggestDuration"));
      }

      const payload = await res.json();
      const suggestion = normalizeDurationSuggestion(payload);
      if (!suggestion) {
        throw new Error(t(locale, "errorSuggestDuration"));
      }

      setDurationSuggestion(suggestion);
      setSelectedDuration(suggestion.suggestedDays);
      setDurationInputMode("ai");
      const latest = readStoredProfile();
      if (latest) setProfile(latest);
      setFlowState("duration_confirm");
    } catch (err: any) {
      setError(err?.message || t(locale, "errorSuggestDuration"));
    } finally {
      setIsLoading(false);
    }
  };

  const runGeneration = async (durationDays: number, generationProfile: UserProfile, answers: PlannerAnswer[]) => {
    const clampedDuration = durationSuggestion
      ? Math.max(durationSuggestion.minDays, Math.min(durationSuggestion.maxDays, durationDays))
      : durationDays;
    const normalizedProfile = preparePlanningProfile(generationProfile);

    setIsLoading(true);
    setError("");
    setFlowState("generating");

    try {
      await startGenerationTask({
        query: query.trim(),
        locale,
        durationDays: clampedDuration,
        planModeEnabled,
        profile: normalizedProfile,
        qaHistory: answers,
        qaSummary: plannerReady?.keyConstraints || [],
      });
    } catch (err: any) {
      setFlowState(planModeEnabled ? "plan_qa" : "goal_input");
      setIsLoading(false);
      setError(mapGenerateError(locale, err?.code, err?.message || t(locale, "errorDesc")));
    }
  };

  const requestPlannerStep = async (history: PlannerAnswer[], profileSnapshot?: UserProfile) => {
    if (!durationSuggestion) return;
    const activeProfile = preparePlanningProfile(profileSnapshot || profile);
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/planner/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          locale,
          durationDays: selectedDuration,
          profile: activeProfile,
          qaHistory: history,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.error) {
        throw new Error(mapPlannerError(locale, payload?.code, payload?.error));
      }
      if ((payload as PlannerAskResponse).status === "ask") {
        const ask = payload as PlannerAskResponse;
        setPlannerQuestion(ask.nextQuestion);
        setPlannerReasoningHint(ask.reasoningHint || "");
        setPlannerProgress(ask.progress || 0);
        setPlannerReady(null);
        setPlannerAnswerValue("");
        setFlowState("plan_qa");
      } else {
        const ready = payload as PlannerReadyResponse;
        setPlannerQuestion(null);
        setPlannerReady(ready);
        setPlannerProgress(ready.progress || 100);
        setPlannerReasoningHint("");
        setFlowState("plan_qa");
      }
    } catch (err: any) {
      setError(err?.message || t(locale, "errorDesc"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPlannerQuestions = async () => {
    if (!hasProDemo) {
      setError(locale === "ar" ? "ميزة التخطيط المتقدم متاحة ضمن PRO. فعّل PRO التجريبي من صفحة الاشتراكات." : "Advanced planning is a PRO feature. Enable PRO demo from Plans.");
      return;
    }
    const latestProfile = readStoredProfile();
    if (!latestProfile) {
      setError(t(locale, "profileRequiredBeforePlan"));
      return;
    }
    const normalizedProfile = preparePlanningProfile(latestProfile);
    const errors = validateProfile(normalizedProfile, locale);
    if (errors.length > 0) {
      setError(errors[0] || t(locale, "profileValidationSummary"));
      return;
    }
    setQaHistory([]);
    setPlannerQuestion(null);
    setPlannerReady(null);
    setPlannerReasoningHint("");
    setPlannerProgress(0);
    setPlannerAnswerValue("");
    setProfile(normalizedProfile);
    setFlowState("plan_qa");
    await requestPlannerStep([], normalizedProfile);
  };

  const handlePlannerAnswerSubmit = async () => {
    if (!plannerQuestion) return;
    if (plannerQuestion.required && !plannerAnswerValue.trim()) {
      setError(locale === "ar" ? "هذا السؤال مطلوب." : "This question is required.");
      return;
    }
    const selectedOption = plannerQuestion.options?.find((item) => item.value === plannerAnswerValue);
    const answer: PlannerAnswer = {
      questionId: plannerQuestion.id,
      value: plannerAnswerValue.trim() || "skipped",
      label: selectedOption ? (locale === "ar" ? selectedOption.labelAr : selectedOption.label) : undefined,
    };
    const nextHistory = [...qaHistory, answer];
    setQaHistory(nextHistory);
    await requestPlannerStep(nextHistory, profile);
  };

  const handleFastGenerate = async () => {
    if (!query.trim()) return;
    const suggestion = await (async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch("/api/suggest-duration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim(), locale }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || t(locale, "errorSuggestDuration"));
        const normalized = normalizeDurationSuggestion(payload);
        if (!normalized) throw new Error(t(locale, "errorSuggestDuration"));
        setDurationSuggestion(normalized);
        setSelectedDuration(normalized.suggestedDays);
        return normalized;
      } finally {
        setIsLoading(false);
      }
    })();
    if (!suggestion) return;
    const quickProfile = createDefaultProfile(query.trim());
    await runGeneration(suggestion.suggestedDays, quickProfile, []);
  };

  const generateProtocol = async () => {
    if (!durationSuggestion) return;
    await runGeneration(selectedDuration, profile, qaHistory);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (planModeEnabled) {
      if (!hasProDemo) {
        setError(locale === "ar" ? "Plan Mode PRO يتطلب تفعيل PRO التجريبي من صفحة الاشتراكات." : "Plan Mode PRO requires enabling PRO demo from Plans.");
        return;
      }
      await requestDurationSuggestion(query);
    } else {
      await handleFastGenerate();
    }
  };

  const handleDurationInput = (value: number) => {
    if (!durationSuggestion || !Number.isFinite(value)) return;
    const clamped = Math.max(durationSuggestion.minDays, Math.min(durationSuggestion.maxDays, Math.round(value)));
    setSelectedDuration(clamped);
  };

  const durationQuickChoices = useMemo(() => {
    if (!durationSuggestion) return [];
    const candidates =
      durationSuggestion.quickOptions && durationSuggestion.quickOptions.length > 0
        ? durationSuggestion.quickOptions
        : [
            Math.max(durationSuggestion.minDays, Math.round(durationSuggestion.suggestedDays * 0.75)),
            durationSuggestion.suggestedDays,
            Math.min(durationSuggestion.maxDays, Math.round(durationSuggestion.suggestedDays * 1.25)),
          ];

    return Array.from(
      new Set(
        candidates
          .map((days) => Math.round(days))
          .filter((days) => days >= durationSuggestion.minDays && days <= durationSuggestion.maxDays)
      )
    );
  }, [durationSuggestion]);

  const handleTogglePlanMode = () => {
    if (!planModeEnabled && !hasProDemo) {
      setError(locale === "ar" ? "فعّل PRO التجريبي من صفحة الاشتراكات لتشغيل Plan Mode PRO." : "Enable PRO demo from Plans to unlock Plan Mode PRO.");
      return;
    }
    setPlanModeEnabled((prev) => !prev);
    setFlowState("goal_input");
    setDurationSuggestion(null);
    setSelectedDuration(14);
    const latest = readStoredProfile();
    if (latest) setProfile(latest);
    setPlannerQuestion(null);
    setPlannerReady(null);
    setPlannerReasoningHint("");
    setPlannerProgress(0);
    setQaHistory([]);
    setError("");
  };

  const handleFocus = () => {
    typewriter.pause();
  };

  const handleBlur = () => {
    if (!query.trim()) {
      typewriter.resume();
    }
  };

  const flowSteps = [
    locale === "ar" ? "الحلم" : "Goal",
    locale === "ar" ? "المدة" : "Duration",
    locale === "ar" ? "الأسئلة" : "Q&A",
    locale === "ar" ? "التوليد" : "Generate",
  ];
  const flowIndex =
    flowState === "goal_input"
      ? 0
      : flowState === "duration_confirm"
      ? 1
      : flowState === "plan_qa"
      ? 2
      : 3;

  return (
    <main className="min-h-screen flex flex-col bg-dark-bg overflow-x-hidden">
      <Navbar />

      <section className="relative min-h-screen pt-16 md:pt-0 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0" />

        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 flex items-end justify-end z-[1]"
        >
          <div className="relative w-[78%] sm:w-[62%] md:w-[45%] h-[58vh] sm:h-[72vh] md:h-[90vh] ltr:mr-[2%] md:ltr:mr-[5%] rtl:ml-[2%] md:rtl:ml-[5%] opacity-35 sm:opacity-60 md:opacity-100" style={{direction: "ltr"}}>
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

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-14 sm:py-20 ux-page-shell">
          <div className="flex items-center min-h-[68vh] sm:min-h-[75vh]">
            <div className="relative z-20 w-full md:w-1/2 max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/15 border border-gold-500/30">
                <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                <span className="text-xs text-gold-400 font-bold tracking-wider uppercase">
                  {t(locale, "aiPowered")}
                </span>
              </div>

              {locale === "ar" ? (
                <>
                  <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-wider mb-2 leading-tight">
                    {t(locale, "siteNameAr")}
                  </h1>
                  <p className="font-heading text-lg md:text-xl text-gray-500 tracking-widest mb-4">
                    {t(locale, "siteName")}
                  </p>
                </>
              ) : (
                <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-wider mb-4 leading-tight">
                  DREAM<span className="text-gold-500">PLAN</span>
                </h1>
              )}

              <p className="font-heading text-lg sm:text-xl md:text-2xl text-gold-400/80 tracking-widest uppercase mb-4">
                {t(locale, "tagline")}
              </p>
              <p className="text-[11px] text-gray-500 tracking-[0.18em] uppercase mb-4">
                BUILT BY MATANY LABS
              </p>

              <p className="text-gray-400 text-sm sm:text-base md:text-lg mb-8 max-w-lg leading-relaxed">
                {t(locale, "heroDescription")}
              </p>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
                {[
                  { value: "7-90", label: locale === "ar" ? "يوم" : "Days" },
                  { value: "70+", label: locale === "ar" ? "مهمة" : "Tasks" },
                  { value: "NEXUS", label: locale === "ar" ? "ذكاء" : "AI" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center">
                    <div className="text-center">
                      <div className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-gold-500">{stat.value}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                    {i < 2 && <div className="w-1 h-1 rounded-full bg-gold-500/40 ltr:ml-6 rtl:mr-6" />}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
                <button
                  onClick={() => document.getElementById("protocol-form")?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-primary px-6 py-3 text-sm active:scale-[0.98]"
                >
                  <ArrowDown className="w-4 h-4" />
                  {locale === "ar" ? "ابدأ الآن" : "Start Now"}
                </button>
                <Link
                  href="/plans"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-secondary px-6 py-3 text-sm active:scale-[0.98]"
                >
                  <Crown className="w-4 h-4" />
                  {locale === "ar" ? "عرض الخطط" : "View Plans"}
                </Link>
                <Link
                  href="/profile"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-ghost px-6 py-3 uppercase text-sm active:scale-[0.98]"
                >
                  {locale === "ar" ? "الملف الشخصي" : "Profile"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-gold-500/50" />
        </motion.div>
      </section>

      <section id="protocol-form" className="relative z-10 px-4 py-12 md:py-16 max-w-5xl mx-auto w-full -mt-10 md:-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="animated-border-wrapper mb-16"
        >
          <div className="animated-border-inner p-5 sm:p-8 md:p-10">
            <div className="mb-5">
              <div className="ux-flow-steps">
                {flowSteps.map((label, index) => (
                  <div key={label} className="ux-flow-step" data-active={index <= flowIndex}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
            {/* Plan Mode toggle lives inside the "Design Your Protocol" block, near the main CTA. */}

            {flowState === "generating" ? (
              <InlinePlanningProgress locale={locale} userGoal={query} />
            ) : flowState === "plan_qa" && durationSuggestion ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg text-white">{t(locale, "aiQuestionsTitle")}</h3>
                  <span className="text-xs text-gold-400">{plannerProgress}%</span>
                </div>
                {plannerQuestion ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-200">
                      {locale === "ar" ? plannerQuestion.questionAr : plannerQuestion.question}
                    </p>
                    <p className="text-xs text-gray-500">
                      {locale === "ar" ? "اختر إجابة واحدة:" : "Choose one answer:"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(plannerQuestion.options || []).map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => setPlannerAnswerValue(option.value)}
                          aria-pressed={plannerAnswerValue === option.value}
                          className={`text-start px-3 py-3 rounded-xl border text-sm transition-all ${
                            plannerAnswerValue === option.value
                              ? "border-gold-500/70 bg-gold-500/10 text-gold-200 shadow-[0_0_0_1px_rgba(212,175,55,0.25)]"
                              : "border-dark-border text-gray-300 hover:border-gold-500/35 hover:bg-black/35"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                plannerAnswerValue === option.value
                                  ? "border-gold-500 bg-gold-500 text-black"
                                  : "border-gray-600"
                              }`}
                            >
                              {plannerAnswerValue === option.value ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : null}
                            </span>
                            <span className="font-medium">
                              {locale === "ar" ? option.labelAr : option.label}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                    {plannerReasoningHint ? <p className="text-xs text-gray-500">{plannerReasoningHint}</p> : null}
                    <button
                      type="button"
                      onClick={handlePlannerAnswerSubmit}
                      disabled={!plannerAnswerValue}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 uppercase text-xs"
                    >
                      {locale === "ar" ? "التالي" : "Next"}
                    </button>
                  </div>
                ) : plannerReady ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-200">{plannerReady.planBrief}</p>
                    <div className="p-3 rounded-lg border border-dark-border bg-black/30">
                      <p className="text-xs text-gray-400 mb-2">{t(locale, "profileFitPanel")}</p>
                      <p className="text-sm text-gray-300">{plannerReady.profileFitSummary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={generateProtocol}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-primary px-6 py-3 uppercase text-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t(locale, "confirmGenerate")}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : flowState === "duration_confirm" && durationSuggestion ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4 text-gold-400" />
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-white text-center tracking-wide">
                    {t(locale, "durationConfirmTitle")}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDurationInputMode("ai");
                      setSelectedDuration(durationSuggestion.suggestedDays);
                    }}
                    className={`rounded-xl border p-3 text-start transition-all ${
                      durationInputMode === "ai"
                        ? "border-gold-500/70 bg-gold-500/12"
                        : "border-dark-border bg-black/20 hover:border-gold-500/35"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                      {locale === "ar" ? "اقتراح AI" : "AI Suggestion"}
                    </p>
                    <p className="font-heading text-2xl text-gold-300 leading-none">
                      {durationSuggestion.suggestedDays}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{locale === "ar" ? "يوم" : "days"}</p>
                  </button>

                  <div className="md:col-span-2 p-4 rounded-xl border border-dark-border bg-black/25">
                    <p className="text-sm text-gray-100 mb-2 leading-relaxed">{durationSuggestion.question}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{durationSuggestion.rationale}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gold-500/25 bg-black/25">
                  <div className="flex items-end justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">{t(locale, "selectedDurationLabel")}</p>
                      <p className="font-heading text-3xl text-gold-300 leading-none">
                        {selectedDuration}
                        <span className="text-sm text-gold-400 ltr:ml-1 rtl:mr-1">{locale === "ar" ? "يوم" : "days"}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationInputMode("ai");
                        setSelectedDuration(durationSuggestion.suggestedDays);
                      }}
                      className="px-3 py-2 rounded-lg border border-gold-500/45 text-xs font-bold text-gold-300 hover:bg-gold-500/12"
                    >
                      {locale === "ar" ? "استخدم اقتراح AI" : "Use AI suggestion"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    {durationQuickChoices.map((days, idx) => (
                      <button
                        key={`${days}-${idx}`}
                        type="button"
                        onClick={() => {
                          setDurationInputMode("custom");
                          handleDurationInput(days);
                        }}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                          selectedDuration === days
                            ? "border-gold-500/70 text-gold-300 bg-gold-500/10"
                            : "border-dark-border text-gray-300 hover:border-gold-500/40"
                        }`}
                      >
                        {days} {locale === "ar" ? "يوم" : "days"}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={durationSuggestion.minDays}
                    max={durationSuggestion.maxDays}
                    value={selectedDuration}
                    onChange={(event) => {
                      setDurationInputMode("custom");
                      handleDurationInput(Number(event.target.value));
                    }}
                    className="w-full accent-gold-500"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>{durationSuggestion.minDays} {locale === "ar" ? "يوم" : "d"}</span>
                    <span>{Math.ceil(selectedDuration / 7)} {locale === "ar" ? "أسابيع تقريبًا" : "weeks approx"}</span>
                    <span>{durationSuggestion.maxDays} {locale === "ar" ? "يوم" : "d"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {planModeEnabled ? (
                    <button
                      type="button"
                      onClick={handleStartPlannerQuestions}
                      disabled={isLoading || !canStartPlanQuestions || !hasProDemo}
                      className="w-full inline-flex items-center justify-center gap-2 ux-btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 uppercase text-sm"
                    >
                      <ClipboardList className="w-4 h-4" />
                      {t(locale, "startAiQuestions")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={generateProtocol}
                      className="w-full inline-flex items-center justify-center gap-2 ux-btn-primary px-8 py-4 uppercase text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t(locale, "confirmGenerate")}
                    </button>
                  )}
                </div>

                {planModeEnabled && !hasProDemo ? (
                  <p className="text-xs text-amber-300 text-center">
                    {locale === "ar" ? "فعّل PRO أولًا من صفحة الاشتراكات." : "Enable PRO first from Plans."}
                  </p>
                ) : null}
                {planModeEnabled && hasProDemo && !canStartPlanQuestions ? (
                  <p className="text-xs text-amber-300 text-center">
                    {t(locale, "profileRequiredBeforePlan")}
                  </p>
                ) : null}
              </div>
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
                <p className="text-gray-500 text-center mb-8 text-sm">{t(locale, "designProtocolDesc")}</p>
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-gray-500">
                          {locale === "ar" ? "FAST مجاني - PLAN PRO تخطيط متقدم" : "FAST is free - PLAN PRO is advanced planning"}
                        </p>
                        <Link href="/plans" className="text-[11px] text-gold-300 hover:text-gold-200">
                          {hasProDemo
                            ? locale === "ar"
                              ? "PRO مفعل"
                              : "PRO active"
                            : locale === "ar"
                            ? "تفعيل PRO"
                            : "Activate PRO"}
                        </Link>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTogglePlanMode}
                          aria-pressed={planModeEnabled}
                          title="Plan mode PRO"
                          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-heading font-bold tracking-wider uppercase border transition-colors active:scale-[0.99] ${
                            planModeEnabled
                              ? "text-black bg-gold-500 border-gold-500 hover:bg-gold-600"
                              : "text-gray-300 bg-black/40 border-dark-border hover:border-gold-500/30 hover:text-gray-200"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            {planModeEnabled ? (
                              <ClipboardList className="w-3.5 h-3.5" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            <span>{planModeEnabled ? "PLAN PRO" : "FAST"}</span>
                          </span>
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || !query.trim()}
                          className="flex-1 inline-flex items-center justify-center gap-2 ux-btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 uppercase text-sm"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                              </svg>
                              {planModeEnabled ? t(locale, "analyzeGoalBtn") : t(locale, "fastGenerateBtn")}
                            </span>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              {planModeEnabled ? t(locale, "analyzeGoalBtn") : t(locale, "fastGenerateBtn")}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </motion.div>
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
                className="bg-dark-card border border-dark-border rounded-xl p-6 text-center relative z-10 ux-card"
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
          className="mb-16"
        >
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-200 tracking-wide">
              {t(locale, "privateProtocolsTitle")}
            </h2>
            <p className="text-gray-500 text-sm mt-2">{t(locale, "privateLocalOnly")}</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-5 ux-card-soft">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-600 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
                <input
                  value={privateSearch}
                  onChange={(event) => setPrivateSearch(event.target.value)}
                  placeholder={t(locale, "privateSearchPlaceholder")}
                  className="w-full bg-black border border-dark-border rounded-lg ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-gray-600" />
                <select
                  value={privateSort}
                  onChange={(event) => setPrivateSort(event.target.value as SortMode)}
                  className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-gold-500"
                >
                  <option value="newest">{t(locale, "privateSortNewest")}</option>
                  <option value="oldest">{t(locale, "privateSortOldest")}</option>
                </select>
              </div>

              {privateProtocols.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllPrivate}
                  className="inline-flex items-center justify-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t(locale, "privateDeleteAll")}
                </button>
              )}
            </div>
          </div>

          {filteredPrivateProtocols.length === 0 ? (
            <div className="rounded-xl border border-dark-border bg-dark-card p-6 text-center text-gray-500 text-sm">
              {t(locale, "privateNoProtocols")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrivateProtocols.map((entry) => {
                const displayTitle = entry.customName || (locale === "ar" ? entry.titleAr : entry.title);
                const subtitle = locale === "ar" ? entry.subtitleAr : entry.subtitle;
                const isRenaming = renameId === entry.id;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-gold-500/30 transition-all ux-card"
                  >
                    <div className="mb-3">
                      {isRenaming ? (
                        <div className="space-y-2">
                          <input
                            value={renameValue}
                            onChange={(event) => setRenameValue(event.target.value)}
                            placeholder={t(locale, "privateNamePlaceholder")}
                            className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gold-500"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveCustomProtocolName(entry.id)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gold-500/15 text-gold-400 border border-gold-500/30"
                            >
                              <Save className="w-3 h-3" />
                              {t(locale, "privateSaveName")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenameId(null);
                                setRenameValue("");
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-dark-border text-gray-400 hover:text-gray-300"
                            >
                              {t(locale, "privateCancelRename")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-heading text-sm font-bold text-gray-100 truncate">{displayTitle}</h3>
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2 min-h-[2rem]">{subtitle}</p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                        {t(locale, "privateTotalDays")}: {entry.totalDays} {locale === "ar" ? "يوم" : "days"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/5 text-gray-500 border border-dark-border">
                        {t(locale, "privateDetailedDays")}: {entry.detailedDays}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 mb-4">
                      {t(locale, "privateCreatedAt")}: {formatDateByLocale(entry.createdAt, locale)}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadPrivateProtocol(entry)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 font-heading font-bold tracking-wider px-4 py-2.5 rounded-lg transition-all text-xs uppercase"
                      >
                        <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                        {t(locale, "privateOpenProtocol")}
                      </button>

                      {!isRenaming && (
                        <button
                          type="button"
                          onClick={() => {
                            setRenameId(entry.id);
                            setRenameValue(entry.customName || "");
                          }}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-dark-border text-gray-400 hover:text-gold-400 hover:border-gold-500/30"
                          title={t(locale, "privateRename")}
                        >
                          <PencilLine className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removePrivateProtocol(entry.id)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-dark-border text-gray-500 hover:text-red-400 hover:border-red-500/30"
                        title={t(locale, "privateDelete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
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
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-gold-500/50 transition-all duration-300 h-full ux-card"
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
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-gold-500/50 transition-all duration-300 h-full ux-card"
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
          className="bg-dark-card border border-gold-500/30 rounded-2xl p-8 md:p-10 text-center ux-card"
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-primary px-8 py-3 uppercase text-sm"
          >
            <Crown className="w-4 h-4" />
            {locale === "ar" ? "عرض الخطط" : "View Plans"}
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 border-t border-dark-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col items-center gap-1 mb-6 text-center">
            <Link href="/" className="font-heading text-base md:text-lg font-bold text-white tracking-[0.18em]">
              DREAM<span className="text-gold-500">PLAN</span>
            </Link>
            <p className="text-[10px] text-gold-300/80 tracking-[0.16em] uppercase">BUILT BY MATANY LABS</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-start">
            <p className="text-gray-600 text-xs flex items-center gap-1 justify-center">
              <Zap className="w-3.5 h-3.5 text-gold-400 inline" />
              {locale === "ar"
                ? "مدعوم بواسطة NEXUS AI — جميع البروتوكولات مبنية على أسس علمية"
                : "Powered by NEXUS AI — All protocols are scientifically grounded"}
            </p>
            <a
              href="https://qure-ai-nexus.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="text-gray-500 text-xs hover:text-gold-400 transition-colors"
            >
              {locale === "ar" ? "مدعوم بواسطة QURE AI" : "Powered by QURE AI"}
            </a>
            <p className="text-gray-600 text-xs">
              {locale === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"} &copy; {new Date().getFullYear()} Dreamplan
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}
