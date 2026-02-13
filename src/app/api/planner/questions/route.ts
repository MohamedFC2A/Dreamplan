import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PlannerAnswer, PlannerQuestion, UserProfile } from "@/lib/planner-types";

type Locale = "ar" | "en";

interface AskResponse {
  status: "ask";
  nextQuestion: PlannerQuestion;
  progress: number;
  reasoningHint: string;
}

interface ReadyResponse {
  status: "ready";
  progress: number;
  planBrief: string;
  keyConstraints: string[];
  profileFitSummary: string;
}

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 6;
const CRITICAL_QUESTION_IDS = ["training_days_per_week", "daily_time_window", "nutrition_style"];

const QUESTION_BANK: PlannerQuestion[] = [
  {
    id: "training_days_per_week",
    question: "How many training days per week can you commit to realistically?",
    questionAr: "كم يوم تدريب أسبوعيًا تقدر تلتزم به بشكل واقعي؟",
    inputType: "single_choice",
    required: true,
    options: [
      { value: "2", label: "2 days", labelAr: "يومان" },
      { value: "3", label: "3 days", labelAr: "3 أيام" },
      { value: "4", label: "4 days", labelAr: "4 أيام" },
      { value: "5_plus", label: "5+ days", labelAr: "5+ أيام" },
    ],
    reasoningHint: "This sets weekly load and recovery distribution.",
    reasoningHintAr: "هذا يحدد توزيع الحمل الأسبوعي والتعافي.",
  },
  {
    id: "daily_time_window",
    question: "How much time can you spend per session?",
    questionAr: "كم وقت متاح لكل جلسة؟",
    inputType: "single_choice",
    required: true,
    options: [
      { value: "20_30", label: "20-30 min", labelAr: "20-30 دقيقة" },
      { value: "30_45", label: "30-45 min", labelAr: "30-45 دقيقة" },
      { value: "45_60", label: "45-60 min", labelAr: "45-60 دقيقة" },
      { value: "60_plus", label: "60+ min", labelAr: "60+ دقيقة" },
    ],
    reasoningHint: "Session duration controls exercise density and progression speed.",
    reasoningHintAr: "مدة الجلسة تتحكم في كثافة التمرين وسرعة التدرج.",
  },
  {
    id: "nutrition_style",
    question: "Which nutrition style can you sustain best?",
    questionAr: "أي نمط تغذية تقدر تستمر عليه بسهولة؟",
    inputType: "single_choice",
    required: true,
    options: [
      { value: "balanced", label: "Balanced", labelAr: "متوازن" },
      { value: "high_protein", label: "High Protein", labelAr: "بروتين عالي" },
      { value: "low_carb", label: "Low Carb", labelAr: "منخفض الكربوهيدرات" },
      { value: "mediterranean", label: "Mediterranean", labelAr: "متوسطي" },
    ],
    reasoningHint: "Nutrition adherence is a major predictor of visible outcomes.",
    reasoningHintAr: "الالتزام الغذائي عامل حاسم في النتائج المرئية.",
  },
  {
    id: "supplements_preference",
    question: "Do you want the plan to include supplements?",
    questionAr: "هل تريد إدراج مكملات في الخطة؟",
    inputType: "single_choice",
    required: false,
    options: [
      { value: "yes", label: "Yes", labelAr: "نعم" },
      { value: "no", label: "No", labelAr: "لا" },
      { value: "minimal", label: "Minimal only", labelAr: "أدنى حد فقط" },
    ],
    reasoningHint: "This controls recommendation scope and budget fit.",
    reasoningHintAr: "هذا يحدد نطاق التوصيات وتوافقها مع الميزانية.",
  },
  {
    id: "movement_constraints",
    question: "Any movements you want to avoid due to pain or preference?",
    questionAr: "هل هناك حركات تريد تجنبها بسبب ألم أو تفضيل؟",
    inputType: "text",
    required: false,
    reasoningHint: "Used to avoid unsafe or low-adherence exercise choices.",
    reasoningHintAr: "يُستخدم لتجنب التمارين غير الآمنة أو منخفضة الالتزام.",
  },
  {
    id: "weekly_priority",
    question: "What should be the #1 weekly priority?",
    questionAr: "ما هي الأولوية رقم 1 أسبوعيًا؟",
    inputType: "single_choice",
    required: false,
    options: [
      { value: "fat_loss", label: "Fat loss", labelAr: "خسارة الدهون" },
      { value: "muscle_shape", label: "Muscle shape", labelAr: "تحسين شكل العضلات" },
      { value: "strength", label: "Strength", labelAr: "القوة" },
      { value: "consistency", label: "Consistency", labelAr: "الاستمرارية" },
    ],
    reasoningHint: "This resolves trade-offs in weekly task selection.",
    reasoningHintAr: "يحسم هذا المفاضلات في اختيار مهام الأسبوع.",
  },
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function isValidProfile(profile: any): profile is UserProfile {
  if (!profile || typeof profile !== "object") return false;
  const requiredStringFields = [
    "injuriesOrConditions",
    "availableEquipment",
    "activityLevel",
    "sex",
    "units",
  ];
  for (const key of requiredStringFields) {
    if (typeof profile[key] !== "string" || !profile[key].trim()) return false;
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
  const normalizedGoal = typeof profile.primaryGoal === "string" && profile.primaryGoal.trim()
    ? profile.primaryGoal.trim()
    : query;
  return {
    ...profile,
    primaryGoal: normalizedGoal,
  };
}

function normalizeQaHistory(raw: any): PlannerAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => ({
      questionId: typeof entry?.questionId === "string" ? entry.questionId : "",
      value: typeof entry?.value === "string" ? entry.value : "",
      label: typeof entry?.label === "string" ? entry.label : undefined,
    }))
    .filter((entry) => entry.questionId && entry.value);
}

function answeredSet(qaHistory: PlannerAnswer[]): Set<string> {
  return new Set(qaHistory.map((item) => item.questionId));
}

function hasCriticalCoverage(qaHistory: PlannerAnswer[]): boolean {
  const answered = answeredSet(qaHistory);
  return CRITICAL_QUESTION_IDS.every((id) => answered.has(id));
}

function shouldReady(qaHistory: PlannerAnswer[]): boolean {
  if (qaHistory.length < MIN_QUESTIONS) return false;
  if (!hasCriticalCoverage(qaHistory)) return false;
  return true;
}

function nextDeterministicQuestion(qaHistory: PlannerAnswer[]): PlannerQuestion | null {
  const answered = answeredSet(qaHistory);
  for (const question of QUESTION_BANK) {
    if (!answered.has(question.id)) return question;
  }
  return null;
}

function buildPlanBrief(locale: Locale, query: string, profile: UserProfile, qaHistory: PlannerAnswer[]): string {
  const constraints = qaHistory.map((qa) => qa.value).slice(0, 3).join(", ");
  if (locale === "ar") {
    return `خطة أسبوعية ذكية لهدف "${query}" مع مراعاة بياناتك (${profile.age} سنة، نشاط ${profile.activityLevel}) وقيود التنفيذ: ${constraints || "التزام واقعي"}.`;
  }
  return `A smart weekly strategy for "${query}", aligned with your profile (${profile.age}y, ${profile.activityLevel} activity) and constraints: ${constraints || "realistic adherence"}.`;
}

function buildKeyConstraints(profile: UserProfile, qaHistory: PlannerAnswer[]): string[] {
  const constraints: string[] = [];
  constraints.push(`Activity level: ${profile.activityLevel}`);
  constraints.push(`Equipment: ${profile.availableEquipment || "none"}`);
  if (profile.injuriesOrConditions && profile.injuriesOrConditions.toLowerCase() !== "none") {
    constraints.push(`Safety filter: ${profile.injuriesOrConditions}`);
  }
  for (const answer of qaHistory.slice(-3)) {
    constraints.push(`${answer.questionId}: ${answer.label || answer.value}`);
  }
  return constraints.slice(0, 6);
}

function buildProfileFitSummary(locale: Locale, profile: UserProfile): string {
  if (locale === "ar") {
    return `الخطة ستُخصص لحالتك الحالية: العمر ${profile.age}، الوزن ${Math.round(
      profile.weightKg
    )} كجم، مستوى نشاط ${profile.activityLevel}، مع تعديل الحمل وفق المعدات والقيود الصحية.`;
  }
  return `The plan will be calibrated to your current profile: age ${profile.age}, weight ${Math.round(
    profile.weightKg
  )} kg, ${profile.activityLevel} activity, with load adjustments for your equipment and safety constraints.`;
}

function computeProgress(qaHistory: PlannerAnswer[]): number {
  const normalized = Math.min(MAX_QUESTIONS, Math.max(0, qaHistory.length));
  return Math.round((normalized / MAX_QUESTIONS) * 100);
}

function needsAiFollowUp(qaHistory: PlannerAnswer[]): boolean {
  if (qaHistory.length === 0) return false;
  const last = qaHistory[qaHistory.length - 1];
  const value = last.value.toLowerCase().trim();
  return value === "other" || value === "unknown" || value.length <= 2;
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

async function aiFollowUpQuestion(
  locale: Locale,
  query: string,
  qaHistory: PlannerAnswer[]
): Promise<PlannerQuestion | null> {
  if (!process.env.DEEPSEEK_API_KEY) return null;
  try {
    const completion = await withTimeout(
      client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Return JSON only for one concise follow-up planning question. JSON keys: id,question,questionAr,reasoningHint,reasoningHintAr.",
          },
          {
            role: "user",
            content: `Goal: ${query}\nLocale: ${locale}\nQA history: ${JSON.stringify(
              qaHistory.slice(-3)
            )}\nCreate one clarifying follow-up question.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 220,
      }),
      8000
    );
    const content = completion.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = parseJsonObject(content);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.question !== "string" || typeof parsed.questionAr !== "string") return null;

    return {
      id: typeof parsed.id === "string" && parsed.id ? parsed.id : `follow_up_${Date.now()}`,
      question: parsed.question,
      questionAr: parsed.questionAr,
      inputType: "text",
      required: false,
      reasoningHint: typeof parsed.reasoningHint === "string" ? parsed.reasoningHint : "Clarifies an ambiguous answer.",
      reasoningHintAr:
        typeof parsed.reasoningHintAr === "string" ? parsed.reasoningHintAr : "توضيح إجابة غير واضحة.",
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const locale: Locale = body?.locale === "en" ? "en" : "ar";
  const durationDays = Number(body?.durationDays);
  const profile = body?.profile;
  const qaHistory = normalizeQaHistory(body?.qaHistory);

  if (!query) {
    return NextResponse.json({ error: "Query is required.", code: "MISSING_QUERY" }, { status: 400 });
  }
  if (!Number.isFinite(durationDays) || durationDays < 7 || durationDays > 90) {
    return NextResponse.json(
      { error: "Duration must be between 7 and 90.", code: "INVALID_DURATION" },
      { status: 400 }
    );
  }
  if (!isValidProfile(profile)) {
    return NextResponse.json({ error: "Valid profile is required.", code: "MISSING_PROFILE" }, { status: 400 });
  }
  const normalizedProfile = normalizeProfile(profile, query);

  if (qaHistory.length >= MAX_QUESTIONS || shouldReady(qaHistory)) {
    const response: ReadyResponse = {
      status: "ready",
      progress: 100,
      planBrief: buildPlanBrief(locale, query, normalizedProfile, qaHistory),
      keyConstraints: buildKeyConstraints(normalizedProfile, qaHistory),
      profileFitSummary: buildProfileFitSummary(locale, normalizedProfile),
    };
    return NextResponse.json(response);
  }

  let question = nextDeterministicQuestion(qaHistory);
  if (needsAiFollowUp(qaHistory)) {
    const followUp = await aiFollowUpQuestion(locale, query, qaHistory);
    if (followUp) {
      question = followUp;
    }
  }

  if (!question) {
    const response: ReadyResponse = {
      status: "ready",
      progress: 100,
      planBrief: buildPlanBrief(locale, query, normalizedProfile, qaHistory),
      keyConstraints: buildKeyConstraints(normalizedProfile, qaHistory),
      profileFitSummary: buildProfileFitSummary(locale, normalizedProfile),
    };
    return NextResponse.json(response);
  }

  const response: AskResponse = {
    status: "ask",
    nextQuestion: question,
    progress: computeProgress(qaHistory),
    reasoningHint: locale === "ar" ? question.reasoningHintAr || "" : question.reasoningHint || "",
  };
  return NextResponse.json(response);
}
