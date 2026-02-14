import { NextRequest, NextResponse } from "next/server";
import { PlannerAnswer, PlannerQuestion, UserProfile } from "@/lib/planner-types";

type Locale = "ar" | "en";
type GoalType = "quick_visual" | "fat_loss" | "muscle_gain" | "posture_definition" | "general";

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

const TOTAL_QUESTIONS = 3;

function classifyGoalType(input: string): GoalType {
  const q = input.toLowerCase();
  if (/(vein|vascular|pump|عروق|وريد|ضخ)/i.test(q)) return "quick_visual";
  if (/(fat|lose|cut|lean|دهون|تنشيف|خسارة)/i.test(q)) return "fat_loss";
  if (/(muscle|bulk|mass|gain|hypertrophy|تضخيم|عضل|كتلة)/i.test(q)) return "muscle_gain";
  if (/(posture|neck|jaw|face|shoulder|وضعية|رقبة|فك|وجه|كتف)/i.test(q)) return "posture_definition";
  return "general";
}

function hashSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isValidProfile(profile: any): profile is UserProfile {
  if (!profile || typeof profile !== "object") return false;
  const requiredStringFields = ["injuriesOrConditions", "availableEquipment", "activityLevel", "sex", "units"];
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

function normalizeQaHistory(raw: any, allowedIds: Set<string>): PlannerAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => ({
      questionId: typeof entry?.questionId === "string" ? entry.questionId : "",
      value: typeof entry?.value === "string" ? entry.value : "",
      label: typeof entry?.label === "string" ? entry.label : undefined,
    }))
    .filter((entry) => entry.questionId && entry.value && allowedIds.has(entry.questionId))
    .slice(0, TOTAL_QUESTIONS);
}

function buildGoalSpecificOptions(goalType: GoalType, locale: Locale) {
  if (goalType === "fat_loss") {
    return [
      {
        value: "nutrition_first",
        label: locale === "ar" ? "أولوية للتغذية الدقيقة" : "Nutrition-first precision",
        labelAr: "أولوية للتغذية الدقيقة",
      },
      {
        value: "training_first",
        label: locale === "ar" ? "أولوية للتمرين المركّز" : "Training-first focus",
        labelAr: "أولوية للتمرين المركّز",
      },
      {
        value: "hybrid",
        label: locale === "ar" ? "مزيج متوازن بين الاثنين" : "Balanced hybrid",
        labelAr: "مزيج متوازن بين الاثنين",
      },
    ];
  }

  if (goalType === "muscle_gain") {
    return [
      {
        value: "strength_priority",
        label: locale === "ar" ? "تركيز على القوة والتدرج" : "Strength + progressive overload",
        labelAr: "تركيز على القوة والتدرج",
      },
      {
        value: "shape_priority",
        label: locale === "ar" ? "تركيز على الشكل والتقسيم" : "Shape and symmetry priority",
        labelAr: "تركيز على الشكل والتقسيم",
      },
      {
        value: "joint_safe_gain",
        label: locale === "ar" ? "زيادة آمنة مع ضغط أقل على المفاصل" : "Joint-safe growth approach",
        labelAr: "زيادة آمنة مع ضغط أقل على المفاصل",
      },
    ];
  }

  if (goalType === "quick_visual") {
    return [
      {
        value: "pump_visual",
        label: locale === "ar" ? "مظهر سريع (Pump + Definition)" : "Fast visual pump and definition",
        labelAr: "مظهر سريع (Pump + Definition)",
      },
      {
        value: "lean_visual",
        label: locale === "ar" ? "مظهر أنشف وثابت أكثر" : "Leaner and more stable look",
        labelAr: "مظهر أنشف وثابت أكثر",
      },
      {
        value: "balanced_visual",
        label: locale === "ar" ? "نتيجة متوازنة بدون ضغط زائد" : "Balanced result with low stress",
        labelAr: "نتيجة متوازنة بدون ضغط زائد",
      },
    ];
  }

  if (goalType === "posture_definition") {
    return [
      {
        value: "posture_first",
        label: locale === "ar" ? "أولوية لتصحيح الوضعية" : "Posture correction first",
        labelAr: "أولوية لتصحيح الوضعية",
      },
      {
        value: "neck_jaw_focus",
        label: locale === "ar" ? "تركيز على الرقبة/الفك" : "Neck and jawline emphasis",
        labelAr: "تركيز على الرقبة/الفك",
      },
      {
        value: "balanced_aesthetic",
        label: locale === "ar" ? "توازن وضعي + جمالي" : "Balanced posture + aesthetics",
        labelAr: "توازن وضعي + جمالي",
      },
    ];
  }

  return [
    {
      value: "habit_system",
      label: locale === "ar" ? "نظام عادات قوي أولًا" : "Strong habit system first",
      labelAr: "نظام عادات قوي أولًا",
    },
    {
      value: "performance_system",
      label: locale === "ar" ? "أداء أعلى وتدرج أوضح" : "Higher performance progression",
      labelAr: "أداء أعلى وتدرج أوضح",
    },
    {
      value: "visual_system",
      label: locale === "ar" ? "تركيز بصري واضح على الشكل" : "Visual physique emphasis",
      labelAr: "تركيز بصري واضح على الشكل",
    },
  ];
}

function buildQuestionPack(query: string, locale: Locale, goalType: GoalType, durationDays: number): PlannerQuestion[] {
  const variant = hashSeed(query) % 2;
  const q1Title =
    locale === "ar"
      ? variant === 0
        ? `أنا فاهم هدفك "${query}". كم يوم تدريب أسبوعيًا تقدر تلتزم به فعلًا؟`
        : `هدفك واضح جدًا. ما الالتزام الواقعي الذي تقدر تحافظ عليه أسبوعيًا؟`
      : variant === 0
      ? `I get your goal "${query}". What weekly training commitment is truly realistic for you?`
      : `Your goal is clear. What commitment level can you honestly sustain each week?`;

  const q2Title =
    locale === "ar"
      ? `للوصول لأفضل نتيجة خلال ${durationDays} يوم، أي أسلوب تحب نركز عليه؟`
      : `To maximize your result across ${durationDays} days, which strategy should lead the plan?`;

  const q3Title =
    locale === "ar"
      ? "ما الشيء الذي سيخليك متحمس جدًا تكمّل الخطة كل أسبوع؟"
      : "Which weekly win would keep you genuinely excited to stick to the plan?";

  return [
    {
      id: "q_commitment",
      question: q1Title,
      questionAr: q1Title,
      inputType: "single_choice",
      required: true,
      options: [
        { value: "3_light", label: "3 focused days", labelAr: "3 أيام مركزة" },
        { value: "4_balanced", label: "4 balanced days", labelAr: "4 أيام متوازنة" },
        { value: "5_push", label: "5 days with higher push", labelAr: "5 أيام بدفع أعلى" },
      ],
      reasoningHint:
        locale === "ar"
          ? "هذا الاختيار يحدد شدة الخطة وتوزيع الاستشفاء بدقة."
          : "This directly controls training intensity and recovery distribution.",
      reasoningHintAr: "هذا الاختيار يحدد شدة الخطة وتوزيع الاستشفاء بدقة.",
    },
    {
      id: "q_strategy",
      question: q2Title,
      questionAr: q2Title,
      inputType: "single_choice",
      required: true,
      options: buildGoalSpecificOptions(goalType, locale),
      reasoningHint:
        locale === "ar"
          ? "هنا نحدد محرك النتيجة الرئيسي بناءً على حلمك."
          : "This defines the primary result driver for your specific goal.",
      reasoningHintAr: "هنا نحدد محرك النتيجة الرئيسي بناءً على حلمك.",
    },
    {
      id: "q_motivation",
      question: q3Title,
      questionAr: q3Title,
      inputType: "single_choice",
      required: true,
      options: [
        {
          value: "mirror_change",
          label: locale === "ar" ? "ألاحظ فرق واضح في المرآة" : "Seeing clear mirror change",
          labelAr: "ألاحظ فرق واضح في المرآة",
        },
        {
          value: "performance_gain",
          label: locale === "ar" ? "أداء أعلى وقوة أقوى أسبوعيًا" : "Weekly strength/performance gains",
          labelAr: "أداء أعلى وقوة أقوى أسبوعيًا",
        },
        {
          value: "consistency_streak",
          label: locale === "ar" ? "استمرارية سهلة بدون ضغط" : "Smooth consistency with low stress",
          labelAr: "استمرارية سهلة بدون ضغط",
        },
      ],
      reasoningHint:
        locale === "ar"
          ? "نعتمد هذا الاختيار لتصميم الخطة بشكل يخليك مستمر ومتحمس."
          : "We use this to design a plan that keeps you motivated and consistent.",
      reasoningHintAr: "نعتمد هذا الاختيار لتصميم الخطة بشكل يخليك مستمر ومتحمس.",
    },
  ];
}

function buildPlanBrief(locale: Locale, query: string, profile: UserProfile, qaHistory: PlannerAnswer[]): string {
  const topAnswers = qaHistory.map((qa) => qa.label || qa.value).slice(0, 3).join(" • ");
  if (locale === "ar") {
    return `ممتاز. تم فهم حلمك "${query}" وبناء اتجاه خطة ذكي يراعي عمرك (${profile.age}) ونشاطك (${profile.activityLevel}) مع تفضيلاتك: ${topAnswers}.`;
  }
  return `Perfect. We understood "${query}" and built a smart direction calibrated to your age (${profile.age}), activity (${profile.activityLevel}), and preferences: ${topAnswers}.`;
}

function buildKeyConstraints(profile: UserProfile, qaHistory: PlannerAnswer[]): string[] {
  const list: string[] = [];
  list.push(`Activity level: ${profile.activityLevel}`);
  list.push(`Equipment: ${profile.availableEquipment}`);
  if (profile.injuriesOrConditions.toLowerCase() !== "none") {
    list.push(`Safety constraints: ${profile.injuriesOrConditions}`);
  }
  qaHistory.forEach((answer) => {
    list.push(`${answer.questionId}: ${answer.label || answer.value}`);
  });
  return list.slice(0, 6);
}

function buildProfileFitSummary(locale: Locale, profile: UserProfile): string {
  if (locale === "ar") {
    return `الخطة ستُضبط على بياناتك الفعلية: عمر ${profile.age}، وزن ${Math.round(
      profile.weightKg
    )} كجم، نشاط ${profile.activityLevel}، ومعداتك المتاحة مع فلترة أمان للإصابات/الحالة الصحية.`;
  }
  return `The plan will be tuned to your real profile: age ${profile.age}, weight ${Math.round(
    profile.weightKg
  )} kg, ${profile.activityLevel} activity, available equipment, and safety constraints.`;
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

  const goalType = classifyGoalType(`${query} ${profile.primaryGoal || ""}`);
  const questionPack = buildQuestionPack(query, locale, goalType, durationDays);
  const allowedIds = new Set(questionPack.map((item) => item.id));
  const qaHistory = normalizeQaHistory(body?.qaHistory, allowedIds);

  if (qaHistory.length >= TOTAL_QUESTIONS) {
    const response: ReadyResponse = {
      status: "ready",
      progress: 100,
      planBrief: buildPlanBrief(locale, query, profile, qaHistory),
      keyConstraints: buildKeyConstraints(profile, qaHistory),
      profileFitSummary: buildProfileFitSummary(locale, profile),
    };
    return NextResponse.json(response);
  }

  const nextQuestion = questionPack[qaHistory.length];
  const response: AskResponse = {
    status: "ask",
    nextQuestion,
    progress: Math.round((qaHistory.length / TOTAL_QUESTIONS) * 100),
    reasoningHint: locale === "ar" ? nextQuestion.reasoningHintAr || "" : nextQuestion.reasoningHint || "",
  };
  return NextResponse.json(response);
}
