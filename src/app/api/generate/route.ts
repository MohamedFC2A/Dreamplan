import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  DayPlan,
  Protocol,
  TaskCategory,
  TaskPoint,
  VisualImpact,
  WeekPlan,
  WeekTask,
} from "@/lib/protocols";
import { PlannerAnswer, UserProfile } from "@/lib/planner-types";

type Locale = "ar" | "en";
type PlanMode = "daily" | "weekly";

const MIN_DURATION_DAYS = 7;
const MAX_DURATION_DAYS = 90;
const VALID_CATEGORIES = new Set<TaskCategory>([
  "wake",
  "meal",
  "supplement",
  "training",
  "recovery",
  "hydration",
  "sleep",
]);
const VALID_IMPACT = new Set<VisualImpact>(["low", "medium", "high"]);

function createDeepSeekClient(): OpenAI | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function parseJsonObject(raw: string): any {
  const trimmed = raw.trim();
  const noFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;
  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  const payload = start >= 0 && end > start ? noFence.slice(start, end + 1) : noFence;
  return JSON.parse(payload);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value: unknown, fallback: string): string {
  return isNonEmptyString(value) ? value.trim() : fallback;
}

function normalizeStringArray(raw: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(raw)) return fallback;
  const values = raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length > 0 ? values : fallback;
}

function normalizeQaHistory(raw: unknown): PlannerAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      questionId: typeof item?.questionId === "string" ? item.questionId : "",
      value: typeof item?.value === "string" ? item.value : "",
      label: typeof item?.label === "string" ? item.label : undefined,
    }))
    .filter((item) => item.questionId && item.value);
}

function isValidProfile(profile: any): profile is UserProfile {
  if (!profile || typeof profile !== "object") return false;
  const requiredStrings = [
    "sex",
    "activityLevel",
    "injuriesOrConditions",
    "availableEquipment",
    "units",
  ];
  for (const key of requiredStrings) {
    if (!isNonEmptyString(profile[key])) return false;
  }
  return (
    Number.isFinite(profile.age) &&
    profile.age >= 13 &&
    profile.age <= 90 &&
    Number.isFinite(profile.heightCm) &&
    profile.heightCm >= 120 &&
    profile.heightCm <= 230 &&
    Number.isFinite(profile.weightKg) &&
    profile.weightKg >= 35 &&
    profile.weightKg <= 250
  );
}

function normalizeProfile(profile: UserProfile, query: string): UserProfile {
  const normalizedGoal =
    typeof profile.primaryGoal === "string" && profile.primaryGoal.trim()
      ? profile.primaryGoal.trim()
      : query;
  return {
    ...profile,
    primaryGoal: normalizedGoal,
  };
}

function defaultProfile(query: string): UserProfile {
  return {
    age: 28,
    sex: "male",
    activityLevel: "moderate",
    primaryGoal: query,
    injuriesOrConditions: "none",
    availableEquipment: "basic gym",
    units: "metric",
    heightCm: 175,
    weightKg: 75,
  };
}

function buildProgressData(mode: PlanMode, durationDays: number, durationWeeks: number) {
  const total = mode === "weekly" ? durationWeeks : durationDays;
  return Array.from({ length: total }, (_, index) => ({
    day: index + 1,
    impact: Math.round(((index + 1) / Math.max(1, total)) * 30),
  }));
}

function buildSafetyNotes(profile: UserProfile): { en: string[]; ar: string[] } {
  const condition = profile.injuriesOrConditions.toLowerCase();
  const notesEn: string[] = [];
  const notesAr: string[] = [];
  if (profile.age < 18) {
    notesEn.push("Minor-safe conservative progression is applied.");
    notesAr.push("تم تطبيق تدرج محافظ وآمن للقاصرين.");
  }
  if (condition !== "none" && condition !== "لا يوجد") {
    notesEn.push("Recommendations were adjusted to respect your conditions.");
    notesAr.push("تم تعديل التوصيات بما يتوافق مع حالتك.");
  }
  if (
    profile.availableEquipment.toLowerCase().includes("none") ||
    profile.availableEquipment.toLowerCase().includes("بدون")
  ) {
    notesEn.push("Bodyweight-first alternatives were used due equipment limits.");
    notesAr.push("تم استخدام بدائل بوزن الجسم بسبب محدودية المعدات.");
  }
  return { en: notesEn, ar: notesAr };
}

function sanitizeTask(task: TaskPoint, profile: UserProfile): TaskPoint {
  const condition = profile.injuriesOrConditions.toLowerCase();
  const joined = `${task.action} ${task.actionAr}`.toLowerCase();
  const next = { ...task };

  if (profile.age < 18 && next.category === "supplement") {
    next.category = "meal";
    next.action = "Food-first recovery protocol with hydration.";
    next.actionAr = "نهج تعافي غذائي أولًا مع الترطيب.";
  }
  if (
    (condition.includes("knee") || condition.includes("ركبة")) &&
    next.category === "training" &&
    (joined.includes("jump") || joined.includes("squat") || joined.includes("run") || joined.includes("قفز"))
  ) {
    next.action = "Low-impact lower-body mobility and controlled strength.";
    next.actionAr = "تمرين سفلي منخفض الصدمة مع حركة وقوة محكومة.";
  }
  return next;
}

function normalizeTask(raw: any, fallbackId: string, profile: UserProfile): TaskPoint | null {
  if (!raw || typeof raw !== "object") return null;
  const category = VALID_CATEGORIES.has(raw.category as TaskCategory)
    ? (raw.category as TaskCategory)
    : "recovery";
  const impact = VALID_IMPACT.has(raw.visualImpact as VisualImpact)
    ? (raw.visualImpact as VisualImpact)
    : "medium";
  const task: TaskPoint = {
    id: normalizeText(raw.id, fallbackId),
    action: normalizeText(raw.action, "Perform practical step."),
    actionAr: normalizeText(raw.actionAr, normalizeText(raw.action, "نفّذ خطوة عملية.")),
    category,
    scienceWhy: normalizeText(raw.scienceWhy, "Evidence-based action."),
    scienceWhyAr: normalizeText(raw.scienceWhyAr, normalizeText(raw.scienceWhy, "خطوة مبنية على دليل.")),
    visualImpact: impact,
    tips: normalizeText(raw.tips, ""),
    tipsAr: normalizeText(raw.tipsAr, normalizeText(raw.tips, "")),
  };
  return sanitizeTask(task, profile);
}

function normalizeWeekTask(raw: any, fallbackId: string, profile: UserProfile): WeekTask | null {
  const base = normalizeTask(raw, fallbackId, profile);
  if (!base) return null;
  return {
    ...base,
    frequency: normalizeText(raw.frequency, "3x/week"),
    frequencyAr: normalizeText(raw.frequencyAr, normalizeText(raw.frequency, "3 مرات/أسبوع")),
  };
}

function fallbackDay(day: number, profile: UserProfile): DayPlan {
  return {
    day,
    title: `Day ${day}`,
    titleAr: `اليوم ${day}`,
    theme: "Consistency",
    themeAr: "الالتزام",
    dailyGoal: "Execute high-adherence actions for visible progress.",
    dailyGoalAr: "نفّذ إجراءات عالية الالتزام لتحقيق تقدم مرئي.",
    tasks: [
      sanitizeTask(
        {
          id: `d${day}-1`,
          action: "Morning hydration and fixed wake-up window.",
          actionAr: "ترطيب صباحي وتوقيت استيقاظ ثابت.",
          category: "wake",
          scienceWhy: "Stable routines improve consistency and recovery.",
          scienceWhyAr: "الروتين الثابت يحسن الالتزام والتعافي.",
          visualImpact: "low",
          tips: "Keep daily wake variance minimal.",
          tipsAr: "حافظ على اختلاف بسيط في توقيت الاستيقاظ.",
        },
        profile
      ),
      sanitizeTask(
        {
          id: `d${day}-2`,
          action: "Protein-focused meals with controlled calories.",
          actionAr: "وجبات بروتين مع سعرات مضبوطة.",
          category: "meal",
          scienceWhy: "Sustained nutrition alignment drives composition changes.",
          scienceWhyAr: "اتساق التغذية يسرّع تغييرات تركيب الجسم.",
          visualImpact: "high",
          tips: "Prioritize whole foods.",
          tipsAr: "اجعل الأولوية للطعام الطبيعي.",
        },
        profile
      ),
      sanitizeTask(
        {
          id: `d${day}-3`,
          action: "Progressive resistance block (30-45 min).",
          actionAr: "وحدة مقاومة تدريجية (30-45 دقيقة).",
          category: "training",
          scienceWhy: "Progressive overload supports visible adaptation.",
          scienceWhyAr: "الحمل التدريجي يدعم التكيف المرئي.",
          visualImpact: "high",
          tips: "Track reps and load.",
          tipsAr: "سجل التكرارات والأوزان.",
        },
        profile
      ),
    ],
  };
}

function fallbackWeek(week: number, profile: UserProfile, notes: { en: string[]; ar: string[] }): WeekPlan {
  return {
    week,
    title: `Week ${week}`,
    titleAr: `الأسبوع ${week}`,
    weeklyGoal: "Weekly progression with balanced training, recovery, and nutrition.",
    weeklyGoalAr: "تدرج أسبوعي متوازن بين التدريب والتعافي والتغذية.",
    tasks: [
      {
        ...sanitizeTask(
          {
            id: `w${week}-1`,
            action: "Progressive strength sessions.",
            actionAr: "جلسات قوة تدريجية.",
            category: "training",
            scienceWhy: "Main driver for physique adaptation.",
            scienceWhyAr: "المحرك الأساسي للتكيف الشكلي.",
            visualImpact: "high",
            tips: "Increase load or reps each week.",
            tipsAr: "زد الحمل أو التكرارات أسبوعيًا.",
          },
          profile
        ),
        frequency: "3x/week",
        frequencyAr: "3 مرات/أسبوع",
      },
      {
        ...sanitizeTask(
          {
            id: `w${week}-2`,
            action: "Daily protein and hydration adherence.",
            actionAr: "الالتزام اليومي بالبروتين والترطيب.",
            category: "meal",
            scienceWhy: "Nutrition consistency strongly impacts outcomes.",
            scienceWhyAr: "ثبات التغذية يؤثر مباشرة على النتائج.",
            visualImpact: "high",
            tips: "Use simple meal templates.",
            tipsAr: "استخدم قوالب وجبات بسيطة.",
          },
          profile
        ),
        frequency: "daily",
        frequencyAr: "يوميًا",
      },
      {
        ...sanitizeTask(
          {
            id: `w${week}-3`,
            action: "Sleep optimization and stress control.",
            actionAr: "تحسين النوم والتحكم بالتوتر.",
            category: "sleep",
            scienceWhy: "Recovery quality drives sustained progress.",
            scienceWhyAr: "جودة التعافي تدعم التقدم المستمر.",
            visualImpact: "medium",
            tips: "Maintain a fixed sleep window.",
            tipsAr: "حافظ على نافذة نوم ثابتة.",
          },
          profile
        ),
        frequency: "daily",
        frequencyAr: "يوميًا",
      },
    ],
    checkpoints: ["Adherence score", "Body trend review", "Performance review"],
    checkpointsAr: ["درجة الالتزام", "مراجعة اتجاه الجسم", "مراجعة الأداء"],
    safetyNotes: notes.en,
    safetyNotesAr: notes.ar,
  };
}

function buildFallbackProtocol(
  query: string,
  locale: Locale,
  durationDays: number,
  planMode: PlanMode,
  profile: UserProfile,
  qaHistory: PlannerAnswer[]
): Protocol {
  const durationWeeks = Math.ceil(durationDays / 7);
  const safetyNotes = buildSafetyNotes(profile);
  const base: Protocol = {
    id: "generated-protocol",
    planMode,
    durationDays,
    durationWeeks,
    title: planMode === "weekly" ? "AI Weekly Protocol" : "AI Daily Protocol",
    titleAr: planMode === "weekly" ? "بروتوكول أسبوعي بالذكاء الاصطناعي" : "بروتوكول يومي بالذكاء الاصطناعي",
    subtitle:
      locale === "ar"
        ? `خطة مخصصة لهدفك: ${query}`
        : `Personalized plan for your goal: ${query}`,
    subtitleAr: `خطة مخصصة لهدفك: ${query}`,
    focus: ["Consistency", "Safety", "Progressive adaptation"],
    focusAr: ["الالتزام", "الأمان", "التدرج"],
    scienceOverview: "Fallback protocol generated with profile-aware conservative defaults.",
    scienceOverviewAr: "تم إنشاء بروتوكول احتياطي محافظ ومراعيًا للملف الشخصي.",
    profileFitSummary: `Calibrated to age ${profile.age}, ${profile.activityLevel} activity, and your equipment limits.`,
    profileFitSummaryAr: `تمت المعايرة حسب العمر ${profile.age}، مستوى النشاط ${profile.activityLevel}، وحدود المعدات.`,
    priorityActions: qaHistory.slice(0, 3).map((item) => item.label || item.value),
    priorityActionsAr: qaHistory.slice(0, 3).map((item) => item.label || item.value),
    safetyNotesGlobal: safetyNotes.en,
    safetyNotesGlobalAr: safetyNotes.ar,
    qaSummary: qaHistory.slice(0, 6).map((item) => `${item.questionId}: ${item.label || item.value}`),
    progressData: buildProgressData(planMode, durationDays, durationWeeks),
    days: [],
    weeks: [],
  };
  if (planMode === "weekly") {
    base.weeks = Array.from({ length: durationWeeks }, (_, index) => fallbackWeek(index + 1, profile, safetyNotes));
  } else {
    base.days = Array.from({ length: durationDays }, (_, index) => fallbackDay(index + 1, profile));
  }
  return base;
}

function normalizeProtocol(
  raw: any,
  query: string,
  locale: Locale,
  durationDays: number,
  planMode: PlanMode,
  profile: UserProfile,
  qaHistory: PlannerAnswer[]
): Protocol {
  const durationWeeks = Math.ceil(durationDays / 7);
  const fallback = buildFallbackProtocol(query, locale, durationDays, planMode, profile, qaHistory);
  const normalized: Protocol = {
    ...fallback,
    title: normalizeText(raw?.title, fallback.title),
    titleAr: normalizeText(raw?.titleAr, fallback.titleAr),
    subtitle: normalizeText(raw?.subtitle, fallback.subtitle),
    subtitleAr: normalizeText(raw?.subtitleAr, fallback.subtitleAr),
    focus: normalizeStringArray(raw?.focus, fallback.focus),
    focusAr: normalizeStringArray(raw?.focusAr, fallback.focusAr),
    scienceOverview: normalizeText(raw?.scienceOverview, fallback.scienceOverview),
    scienceOverviewAr: normalizeText(raw?.scienceOverviewAr, fallback.scienceOverviewAr),
    profileFitSummary: normalizeText(raw?.profileFitSummary, fallback.profileFitSummary || ""),
    profileFitSummaryAr: normalizeText(raw?.profileFitSummaryAr, fallback.profileFitSummaryAr || ""),
    priorityActions: normalizeStringArray(raw?.priorityActions, fallback.priorityActions || []),
    priorityActionsAr: normalizeStringArray(raw?.priorityActionsAr, fallback.priorityActionsAr || []),
  };

  if (planMode === "weekly") {
    const weeksRaw = Array.isArray(raw?.weeks) ? raw.weeks : [];
    if (weeksRaw.length === 0) return fallback;
    const weeks = Array.from({ length: durationWeeks }, (_, index) => {
      const weekNumber = index + 1;
      const picked = weeksRaw.find((item: any) => Math.round(Number(item?.week)) === weekNumber);
      if (!picked) return fallbackWeek(weekNumber, profile, buildSafetyNotes(profile));
      const tasks = Array.isArray(picked.tasks)
        ? picked.tasks
            .map((item: any, idx: number) => normalizeWeekTask(item, `w${weekNumber}-t${idx + 1}`, profile))
            .filter((item: WeekTask | null): item is WeekTask => Boolean(item))
        : [];
      if (tasks.length === 0) return fallbackWeek(weekNumber, profile, buildSafetyNotes(profile));
      return {
        week: weekNumber,
        title: normalizeText(picked.title, `Week ${weekNumber}`),
        titleAr: normalizeText(picked.titleAr, `الأسبوع ${weekNumber}`),
        weeklyGoal: normalizeText(picked.weeklyGoal, "Progressive weekly adaptation."),
        weeklyGoalAr: normalizeText(picked.weeklyGoalAr, "تدرج أسبوعي واقعي."),
        tasks,
        checkpoints: normalizeStringArray(picked.checkpoints, ["Adherence review"]),
        checkpointsAr: normalizeStringArray(picked.checkpointsAr, ["مراجعة الالتزام"]),
        safetyNotes: normalizeStringArray(picked.safetyNotes, normalized.safetyNotesGlobal || []),
        safetyNotesAr: normalizeStringArray(picked.safetyNotesAr, normalized.safetyNotesGlobalAr || []),
      };
    });
    normalized.weeks = weeks;
    normalized.days = [];
  } else {
    const daysRaw = Array.isArray(raw?.days) ? raw.days : [];
    if (daysRaw.length === 0) return fallback;
    const days = Array.from({ length: durationDays }, (_, index) => {
      const dayNumber = index + 1;
      const picked = daysRaw.find((item: any) => Math.round(Number(item?.day)) === dayNumber);
      if (!picked) return fallbackDay(dayNumber, profile);
      const tasks = Array.isArray(picked.tasks)
        ? picked.tasks
            .map((item: any, idx: number) => normalizeTask(item, `d${dayNumber}-t${idx + 1}`, profile))
            .filter((item: TaskPoint | null): item is TaskPoint => Boolean(item))
        : [];
      if (tasks.length === 0) return fallbackDay(dayNumber, profile);
      return {
        day: dayNumber,
        title: normalizeText(picked.title, `Day ${dayNumber}`),
        titleAr: normalizeText(picked.titleAr, `اليوم ${dayNumber}`),
        theme: normalizeText(picked.theme, "Milestone"),
        themeAr: normalizeText(picked.themeAr, "مرحلة"),
        dailyGoal: normalizeText(picked.dailyGoal, "Execute your plan with high consistency."),
        dailyGoalAr: normalizeText(picked.dailyGoalAr, "نفّذ الخطة بثبات مرتفع."),
        tasks,
      };
    });
    normalized.days = days;
    normalized.weeks = [];
  }

  return normalized;
}

function buildPrompt(
  mode: PlanMode,
  locale: Locale,
  query: string,
  durationDays: number,
  durationWeeks: number,
  profile: UserProfile,
  qaHistory: PlannerAnswer[]
): string {
  const shape =
    mode === "weekly"
      ? `Output JSON with keys: title,titleAr,subtitle,subtitleAr,focus,focusAr,scienceOverview,scienceOverviewAr,profileFitSummary,profileFitSummaryAr,priorityActions,priorityActionsAr,weeks[].`
      : `Output JSON with keys: title,titleAr,subtitle,subtitleAr,focus,focusAr,scienceOverview,scienceOverviewAr,profileFitSummary,profileFitSummaryAr,priorityActions,priorityActionsAr,days[].`;
  return `Build a realistic ${mode} protocol. JSON only.\nGoal: ${query}\nLocale: ${locale}\nDurationDays: ${durationDays}\nDurationWeeks: ${durationWeeks}\nProfile: ${JSON.stringify(
    profile
  )}\nQ&A: ${JSON.stringify(qaHistory.slice(0, 6))}\nRules: concise practical output, no unsafe recommendations, no impossible schedule, allowed categories wake meal supplement training recovery hydration sleep, visualImpact low|medium|high. ${shape}`;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const locale: Locale = body?.locale === "en" ? "en" : "ar";
  const duration = Number(body?.durationDays);
  const durationDays = Number.isFinite(duration) ? Math.round(duration) : Number.NaN;
  const plannerModeEnabled = body?.planModeEnabled !== false;
  const qaHistory = normalizeQaHistory(body?.qaHistory);

  if (!query) {
    return NextResponse.json({ error: "Query is required.", code: "MISSING_QUERY" }, { status: 400 });
  }
  if (!Number.isFinite(durationDays) || durationDays < MIN_DURATION_DAYS || durationDays > MAX_DURATION_DAYS) {
    return NextResponse.json(
      { error: "Duration must be between 7 and 90 days.", code: "INVALID_DURATION" },
      { status: 400 }
    );
  }

  const rawProfile = body?.profile;
  const parsedProfile = isValidProfile(rawProfile) ? normalizeProfile(rawProfile, query) : null;
  const profile = plannerModeEnabled
    ? parsedProfile
    : parsedProfile || defaultProfile(query);

  if (!profile) {
    return NextResponse.json({ error: "Valid profile is required.", code: "MISSING_PROFILE" }, { status: 400 });
  }

  const mode: PlanMode = durationDays > 7 ? "weekly" : "daily";
  const durationWeeks = Math.ceil(durationDays / 7);
  const fallback = buildFallbackProtocol(query, locale, durationDays, mode, profile, qaHistory);

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json(fallback);
  }
  const client = createDeepSeekClient();
  if (!client) {
    return NextResponse.json(fallback);
  }

  const prompt = buildPrompt(mode, locale, query, durationDays, durationWeeks, profile, qaHistory);
  const attempts = [
    { maxTokens: 1400, timeoutMs: 12000 },
    { maxTokens: 900, timeoutMs: 8000 },
  ];

  for (const attempt of attempts) {
    try {
      const completion = await withTimeout(
        client.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: `Goal: ${query}. Return JSON only.` },
          ],
          max_tokens: attempt.maxTokens,
          temperature: 0.35,
        }),
        attempt.timeoutMs
      );
      const content = completion.choices[0]?.message?.content;
      if (!content) continue;
      const parsed = parseJsonObject(content);
      const protocol = normalizeProtocol(parsed, query, locale, durationDays, mode, profile, qaHistory);
      return NextResponse.json(protocol);
    } catch {
      continue;
    }
  }

  return NextResponse.json(fallback);
}
