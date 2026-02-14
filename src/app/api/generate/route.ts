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
type GoalArchetype =
  | "speed_performance"
  | "fat_loss"
  | "muscle_gain"
  | "quick_visual"
  | "posture_definition"
  | "general";

interface GoalBlueprint {
  archetype: GoalArchetype;
  titleEn: string;
  titleAr: string;
  focusEn: string[];
  focusAr: string[];
  overviewEn: string;
  overviewAr: string;
  dailyGoalEn: string;
  dailyGoalAr: string;
  weeklyGoalEn: string;
  weeklyGoalAr: string;
  trainingTaskEn: string;
  trainingTaskAr: string;
  nutritionTaskEn: string;
  nutritionTaskAr: string;
  recoveryTaskEn: string;
  recoveryTaskAr: string;
  supplementTaskEn: string;
  supplementTaskAr: string;
  alignmentKeywords: string[];
}

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

function inferGoalArchetype(query: string): GoalArchetype {
  const q = query.toLowerCase();
  if (/(speed|sprint|acceleration|agility|explosive|quickness|soccer|football|ronaldo|cr7|سرعة|انطلاق|رشاقة|انفجار|رونالدو|كرة)/i.test(q)) {
    return "speed_performance";
  }
  if (/(fat|lose|cut|lean|shred|دهون|تنشيف|خسارة)/i.test(q)) return "fat_loss";
  if (/(muscle|mass|bulk|hypertrophy|gain|عضل|كتلة|تضخيم)/i.test(q)) return "muscle_gain";
  if (/(vein|vascular|pump|عروق|وريد|ضخ)/i.test(q)) return "quick_visual";
  if (/(posture|neck|jaw|face|shoulder|وضعية|رقبة|فك|وجه|كتف)/i.test(q)) return "posture_definition";
  return "general";
}

function inferPersonaTag(query: string): string {
  const q = query.toLowerCase();
  if (/(ronaldo|cr7|كريستيانو|رونالدو)/i.test(q)) return "Cristiano-Ronaldo-style";
  if (/(messi|ميسي)/i.test(q)) return "Lionel-Messi-style";
  return "none";
}

function buildGoalBlueprint(query: string): GoalBlueprint {
  const archetype = inferGoalArchetype(query);
  const persona = inferPersonaTag(query);

  if (archetype === "speed_performance") {
    return {
      archetype,
      titleEn: persona !== "none" ? "Elite Speed Performance Protocol" : "Explosive Speed Protocol",
      titleAr: persona !== "none" ? "بروتوكول سرعة احترافي" : "بروتوكول سرعة وانفجار",
      focusEn: ["Sprint mechanics", "Acceleration power", "Repeat sprint endurance"],
      focusAr: ["ميكانيكا السرعة", "قوة الانطلاق", "تحمل التكرارات السريعة"],
      overviewEn:
        "This protocol prioritizes acceleration mechanics, elastic power, and high-quality sprint exposures with controlled recovery.",
      overviewAr:
        "هذا البروتوكول يركز على ميكانيكا الانطلاق، القوة الانفجارية، والتعرّضات السريعة عالية الجودة مع تعافٍ مضبوط.",
      dailyGoalEn: "Improve sprint quality, explosive force, and repeat-speed resilience.",
      dailyGoalAr: "رفع جودة السرعة، القوة الانفجارية، وتحمل التكرارات السريعة.",
      weeklyGoalEn: "Build measurable acceleration and top-speed transfer each week.",
      weeklyGoalAr: "بناء تطور أسبوعي قابل للقياس في الانطلاق والسرعة القصوى.",
      trainingTaskEn: "Sprint mechanics block: acceleration starts, resisted sprint drills, and plyometric power work.",
      trainingTaskAr: "وحدة ميكانيكا سرعة: انطلاقات قصيرة، تدريبات مقاومة، وبلايومتريك انفجاري.",
      nutritionTaskEn: "Performance fueling with carb timing + protein targets to support neural and muscular output.",
      nutritionTaskAr: "تغذية أداء مع توقيت الكربوهيدرات + بروتين كافٍ لدعم الإخراج العصبي والعضلي.",
      recoveryTaskEn: "Hamstring/hip mobility, ankle stiffness drills, and sleep-focused recovery.",
      recoveryTaskAr: "حركة الورك والخلفية، تمارين كاحل، وتعافٍ مركز على النوم.",
      supplementTaskEn: "Optional performance stack: creatine monohydrate and structured pre-session caffeine.",
      supplementTaskAr: "حزمة أداء اختيارية: كرياتين مونوهيدرات وكافيين منظم قبل الجلسة.",
      alignmentKeywords: ["speed", "sprint", "acceleration", "agility", "explosive", "سرعة", "انطلاق", "رشاقة", "انفجار"],
    };
  }

  if (archetype === "fat_loss") {
    return {
      archetype,
      titleEn: "Precision Fat-Loss Protocol",
      titleAr: "بروتوكول تنشيف دقيق",
      focusEn: ["Calorie control", "Muscle preservation", "Sustainable adherence"],
      focusAr: ["ضبط السعرات", "حماية العضلات", "التزام مستدام"],
      overviewEn: "Focuses on practical caloric deficit with protein protection and fatigue-controlled training density.",
      overviewAr: "يركّز على عجز سعرات عملي مع حماية الكتلة العضلية وكثافة تدريب مضبوطة.",
      dailyGoalEn: "Drive fat reduction while preserving performance and consistency.",
      dailyGoalAr: "خفض الدهون مع الحفاظ على الأداء والاستمرارية.",
      weeklyGoalEn: "Create visible composition change without rebound risk.",
      weeklyGoalAr: "تحقيق تغيير مرئي في تركيب الجسم دون ارتداد.",
      trainingTaskEn: "Metabolic resistance circuit with controlled rest and progressive effort.",
      trainingTaskAr: "دائرة مقاومة أيضية براحة مضبوطة ومجهود متدرج.",
      nutritionTaskEn: "Deficit-focused meal structure with high protein and fiber anchors.",
      nutritionTaskAr: "هيكلة وجبات بعجز حراري مع بروتين وألياف مرتفعة.",
      recoveryTaskEn: "Low-stress recovery walks and sleep regularity.",
      recoveryTaskAr: "تعافٍ منخفض الضغط عبر المشي المنتظم والنوم الثابت.",
      supplementTaskEn: "Optional: omega-3 and whey support based on diet gap.",
      supplementTaskAr: "اختياري: أوميجا-3 ودعم واي بروتين حسب نقص النظام الغذائي.",
      alignmentKeywords: ["fat", "cut", "lean", "deficit", "دهون", "تنشيف", "عجز"],
    };
  }

  if (archetype === "muscle_gain") {
    return {
      archetype,
      titleEn: "Muscle Gain Progression Protocol",
      titleAr: "بروتوكول زيادة عضلية متدرجة",
      focusEn: ["Progressive overload", "Volume quality", "Recovery capacity"],
      focusAr: ["حمل تدريجي", "جودة الحجم التدريبي", "قدرة التعافي"],
      overviewEn: "Structured hypertrophy blocks with load progression, movement quality, and recovery-aware nutrition.",
      overviewAr: "بلوكات تضخيم منظمة مع تدرج حمل وجودة حركة وتغذية داعمة للتعافي.",
      dailyGoalEn: "Increase quality volume and drive measurable hypertrophy signals.",
      dailyGoalAr: "رفع الحجم التدريبي عالي الجودة لإشارات تضخيم قابلة للقياس.",
      weeklyGoalEn: "Add measurable strength and shape gains each week.",
      weeklyGoalAr: "إضافة مكاسب قوة وشكل بشكل أسبوعي واضح.",
      trainingTaskEn: "Primary lift progression + accessory hypertrophy cluster work.",
      trainingTaskAr: "تدرج تمارين أساسية + مجموعة تمارين تضخيم مساعدة.",
      nutritionTaskEn: "Surplus-oriented nutrition with protein distribution across the day.",
      nutritionTaskAr: "تغذية بفائض محسوب مع توزيع البروتين خلال اليوم.",
      recoveryTaskEn: "Mobility + sleep depth + fatigue management.",
      recoveryTaskAr: "حركة مفصلية + نوم عميق + إدارة الإرهاق.",
      supplementTaskEn: "Optional: creatine monohydrate + protein support.",
      supplementTaskAr: "اختياري: كرياتين مونوهيدرات + دعم بروتيني.",
      alignmentKeywords: ["muscle", "mass", "bulk", "hypertrophy", "عضل", "تضخيم", "كتلة"],
    };
  }

  if (archetype === "quick_visual") {
    return {
      archetype,
      titleEn: "Quick Visual Impact Protocol",
      titleAr: "بروتوكول تأثير بصري سريع",
      focusEn: ["Pump quality", "Vascular visibility", "Water balance discipline"],
      focusAr: ["جودة الضخ", "إبراز العروق", "انضباط توازن السوائل"],
      overviewEn: "Short-horizon aesthetic optimization through pump-driven training and hydration precision.",
      overviewAr: "تحسين جمالي سريع عبر تمارين ضخ مركزة وضبط الترطيب.",
      dailyGoalEn: "Maximize visible muscular definition and vascular expression.",
      dailyGoalAr: "تعظيم التحديد العضلي الظاهر وإبراز العروق.",
      weeklyGoalEn: "Deliver noticeable visual delta each week.",
      weeklyGoalAr: "تقديم فرق بصري ملحوظ أسبوعيًا.",
      trainingTaskEn: "High-density pump session for target area with controlled tempo.",
      trainingTaskAr: "جلسة ضخ عالية الكثافة للمنطقة المستهدفة بإيقاع محكوم.",
      nutritionTaskEn: "Hydration and sodium balance with clean-carb timing.",
      nutritionTaskAr: "ترطيب وتوازن صوديوم مع توقيت كربوهيدرات نظيف.",
      recoveryTaskEn: "Light tissue recovery to preserve training quality.",
      recoveryTaskAr: "تعافٍ نسيجي خفيف للحفاظ على جودة التمرين.",
      supplementTaskEn: "Optional nitric-oxide support before key sessions.",
      supplementTaskAr: "اختياري: دعم أكسيد النيتريك قبل الجلسات الرئيسية.",
      alignmentKeywords: ["vein", "vascular", "pump", "عروق", "وريد", "ضخ"],
    };
  }

  if (archetype === "posture_definition") {
    return {
      archetype,
      titleEn: "Posture & Definition Protocol",
      titleAr: "بروتوكول وضعية وتحديد",
      focusEn: ["Postural alignment", "Neck/upper-chain tone", "Consistency"],
      focusAr: ["محاذاة وضعية", "نغمة الرقبة والجزء العلوي", "استمرارية"],
      overviewEn: "Targets appearance via posture mechanics, upper-chain activation, and sustainable execution.",
      overviewAr: "يستهدف الشكل عبر ميكانيكا الوضعية وتنشيط الجزء العلوي وتنفيذ مستدام.",
      dailyGoalEn: "Improve visible posture and upper-body definition cues.",
      dailyGoalAr: "تحسين الوضعية الظاهرة وإشارات التحديد العلوي.",
      weeklyGoalEn: "Build stable postural control with visible aesthetic carryover.",
      weeklyGoalAr: "بناء تحكم وضعي ثابت مع انعكاس جمالي واضح.",
      trainingTaskEn: "Upper-chain posture complex with neck-safe activation.",
      trainingTaskAr: "مركب وضعية للجزء العلوي مع تنشيط آمن للرقبة.",
      nutritionTaskEn: "Body-composition-supportive nutrition to reveal definition.",
      nutritionTaskAr: "تغذية داعمة لتركيب الجسم لإظهار التحديد.",
      recoveryTaskEn: "Thoracic mobility and anti-stiffness reset routine.",
      recoveryTaskAr: "روتين مرونة صدري وإزالة التيبّس.",
      supplementTaskEn: "Optional magnesium and omega-3 support.",
      supplementTaskAr: "اختياري: مغنيسيوم وأوميجا-3.",
      alignmentKeywords: ["posture", "neck", "jaw", "وضعية", "رقبة", "فك"],
    };
  }

  return {
    archetype,
    titleEn: "Adaptive Goal Protocol",
    titleAr: "بروتوكول هدف تكيفي",
    focusEn: ["Execution quality", "Progressive adaptation", "Recovery discipline"],
    focusAr: ["جودة التنفيذ", "تكيف تدريجي", "انضباط التعافي"],
    overviewEn: "General adaptive plan tuned to your short goal phrase and profile constraints.",
    overviewAr: "خطة تكيفية عامة مضبوطة حسب هدفك المختصر وقيود ملفك الشخصي.",
    dailyGoalEn: "Execute high-value actions tied directly to your target goal.",
    dailyGoalAr: "تنفيذ خطوات عالية القيمة مرتبطة مباشرة بهدفك.",
    weeklyGoalEn: "Build measurable progress with strict adherence and low friction.",
    weeklyGoalAr: "بناء تقدم قابل للقياس مع التزام عالي واحتكاك منخفض.",
    trainingTaskEn: "Primary movement block aligned with your goal emphasis.",
    trainingTaskAr: "بلوك حركة أساسي مطابق لتركيز هدفك.",
    nutritionTaskEn: "Nutrition structure supporting performance and body response.",
    nutritionTaskAr: "هيكل تغذية يدعم الأداء واستجابة الجسم.",
    recoveryTaskEn: "Recovery stack to protect consistency and output quality.",
    recoveryTaskAr: "حزمة تعافٍ لحماية الاستمرارية وجودة الأداء.",
    supplementTaskEn: "Optional supplement support based on profile and goal.",
    supplementTaskAr: "دعم مكملات اختياري حسب الهدف والملف الشخصي.",
    alignmentKeywords: query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 4),
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

function fallbackDay(day: number, profile: UserProfile, blueprint: GoalBlueprint): DayPlan {
  return {
    day,
    title: `Day ${day}`,
    titleAr: `اليوم ${day}`,
    theme: blueprint.focusEn[Math.min(day % blueprint.focusEn.length, blueprint.focusEn.length - 1)] || "Execution",
    themeAr: blueprint.focusAr[Math.min(day % blueprint.focusAr.length, blueprint.focusAr.length - 1)] || "تنفيذ",
    dailyGoal: blueprint.dailyGoalEn,
    dailyGoalAr: blueprint.dailyGoalAr,
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
          action: blueprint.nutritionTaskEn,
          actionAr: blueprint.nutritionTaskAr,
          category: "meal",
          scienceWhy: "Nutrition matching your goal architecture is essential for visible outcomes.",
          scienceWhyAr: "مواءمة التغذية مع هندسة الهدف ضرورية للنتائج المرئية.",
          visualImpact: "high",
          tips: "Use pre-planned meal templates for adherence.",
          tipsAr: "استخدم قوالب وجبات جاهزة لتثبيت الالتزام.",
        },
        profile
      ),
      sanitizeTask(
        {
          id: `d${day}-3`,
          action: blueprint.trainingTaskEn,
          actionAr: blueprint.trainingTaskAr,
          category: "training",
          scienceWhy: "Direct goal-specific training creates the highest transfer to your target outcome.",
          scienceWhyAr: "التمرين المرتبط مباشرة بالهدف يصنع أعلى انتقال للنتيجة المطلوبة.",
          visualImpact: "high",
          tips: "Track quality metrics every session.",
          tipsAr: "سجل مؤشرات الجودة كل جلسة.",
        },
        profile
      ),
      sanitizeTask(
        {
          id: `d${day}-4`,
          action: blueprint.recoveryTaskEn,
          actionAr: blueprint.recoveryTaskAr,
          category: "recovery",
          scienceWhy: "Recovery quality controls adaptation speed and injury risk.",
          scienceWhyAr: "جودة التعافي تتحكم في سرعة التكيف ومخاطر الإصابة.",
          visualImpact: "medium",
          tips: "Prioritize mobility and sleep depth.",
          tipsAr: "أعطِ أولوية للحركة وجودة النوم.",
        },
        profile
      ),
      sanitizeTask(
        {
          id: `d${day}-5`,
          action: blueprint.supplementTaskEn,
          actionAr: blueprint.supplementTaskAr,
          category: "supplement",
          scienceWhy: "Targeted supplementation can support execution quality when matched to goal and profile.",
          scienceWhyAr: "المكملات الموجهة قد تدعم جودة التنفيذ عند مواءمتها مع الهدف والملف.",
          visualImpact: "medium",
          tips: "Use only if compatible with your health condition.",
          tipsAr: "استخدم فقط إذا كان مناسبًا لحالتك الصحية.",
        },
        profile
      ),
    ],
  };
}

function fallbackWeek(week: number, profile: UserProfile, notes: { en: string[]; ar: string[] }, blueprint: GoalBlueprint): WeekPlan {
  return {
    week,
    title: `Week ${week}`,
    titleAr: `الأسبوع ${week}`,
    weeklyGoal: blueprint.weeklyGoalEn,
    weeklyGoalAr: blueprint.weeklyGoalAr,
    tasks: [
      {
        ...sanitizeTask(
          {
            id: `w${week}-1`,
            action: blueprint.trainingTaskEn,
            actionAr: blueprint.trainingTaskAr,
            category: "training",
            scienceWhy: "Primary goal-aligned training block for measurable transfer.",
            scienceWhyAr: "بلوك تدريب أساسي مرتبط بالهدف لانتقال قابل للقياس.",
            visualImpact: "high",
            tips: "Increase difficulty progressively based on quality.",
            tipsAr: "زد الصعوبة تدريجيًا حسب جودة التنفيذ.",
          },
          profile
        ),
        frequency: blueprint.archetype === "speed_performance" ? "4x/week" : "3x/week",
        frequencyAr: blueprint.archetype === "speed_performance" ? "4 مرات/أسبوع" : "3 مرات/أسبوع",
      },
      {
        ...sanitizeTask(
          {
            id: `w${week}-2`,
            action: blueprint.nutritionTaskEn,
            actionAr: blueprint.nutritionTaskAr,
            category: "meal",
            scienceWhy: "Nutrition architecture must match the target adaptation.",
            scienceWhyAr: "هندسة التغذية يجب أن تتطابق مع التكيف المطلوب.",
            visualImpact: "high",
            tips: "Keep execution friction low with repeatable meals.",
            tipsAr: "قلل الاحتكاك بقوالب وجبات قابلة للتكرار.",
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
            action: blueprint.recoveryTaskEn,
            actionAr: blueprint.recoveryTaskAr,
            category: "recovery",
            scienceWhy: "Recovery bandwidth determines how much quality training you can absorb.",
            scienceWhyAr: "سعة التعافي تحدد كم تدريب عالي الجودة يمكنك استيعابه.",
            visualImpact: "medium",
            tips: "Protect sleep rhythm and mobility routines.",
            tipsAr: "احمِ إيقاع النوم وروتين الحركة.",
          },
          profile
        ),
        frequency: "daily",
        frequencyAr: "يوميًا",
      },
      {
        ...sanitizeTask(
          {
            id: `w${week}-4`,
            action: blueprint.supplementTaskEn,
            actionAr: blueprint.supplementTaskAr,
            category: "supplement",
            scienceWhy: "Supplement timing may improve readiness and output quality.",
            scienceWhyAr: "توقيت المكملات قد يحسن الجاهزية وجودة الأداء.",
            visualImpact: "medium",
            tips: "Match dosage to safety and tolerance.",
            tipsAr: "اضبط الجرعات حسب الأمان والتحمل.",
          },
          profile
        ),
        frequency: "3-5x/week",
        frequencyAr: "3-5 مرات/أسبوع",
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
  const blueprint = buildGoalBlueprint(query);
  const base: Protocol = {
    id: "generated-protocol",
    planMode,
    durationDays,
    durationWeeks,
    title: blueprint.titleEn,
    titleAr: blueprint.titleAr,
    subtitle:
      locale === "ar"
        ? `خطة مخصصة لهدفك: ${query}`
        : `Personalized plan for your goal: ${query}`,
    subtitleAr: `خطة مخصصة لهدفك: ${query}`,
    focus: blueprint.focusEn,
    focusAr: blueprint.focusAr,
    scienceOverview: blueprint.overviewEn,
    scienceOverviewAr: blueprint.overviewAr,
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
    base.weeks = Array.from({ length: durationWeeks }, (_, index) => fallbackWeek(index + 1, profile, safetyNotes, blueprint));
  } else {
    base.days = Array.from({ length: durationDays }, (_, index) => fallbackDay(index + 1, profile, blueprint));
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
  const blueprint = buildGoalBlueprint(query);
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
      if (!picked) return fallbackWeek(weekNumber, profile, buildSafetyNotes(profile), blueprint);
      const tasks = Array.isArray(picked.tasks)
        ? picked.tasks
            .map((item: any, idx: number) => normalizeWeekTask(item, `w${weekNumber}-t${idx + 1}`, profile))
            .filter((item: WeekTask | null): item is WeekTask => Boolean(item))
        : [];
      if (tasks.length === 0) return fallbackWeek(weekNumber, profile, buildSafetyNotes(profile), blueprint);
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
      if (!picked) return fallbackDay(dayNumber, profile, blueprint);
      const tasks = Array.isArray(picked.tasks)
        ? picked.tasks
            .map((item: any, idx: number) => normalizeTask(item, `d${dayNumber}-t${idx + 1}`, profile))
            .filter((item: TaskPoint | null): item is TaskPoint => Boolean(item))
        : [];
      if (tasks.length === 0) return fallbackDay(dayNumber, profile, blueprint);
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

function matchesGoalAlignment(text: string, keywords: string[]): boolean {
  const value = text.toLowerCase();
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()));
}

function createGoalTrainingTask(id: string, blueprint: GoalBlueprint, profile: UserProfile): TaskPoint {
  return sanitizeTask(
    {
      id,
      action: blueprint.trainingTaskEn,
      actionAr: blueprint.trainingTaskAr,
      category: "training",
      scienceWhy: "Direct goal-specific stimulus improves transfer to the exact target outcome.",
      scienceWhyAr: "الحافز التدريبي المرتبط مباشرة بالهدف يرفع الانتقال للنتيجة المطلوبة.",
      visualImpact: "high",
      tips: "Track one core performance metric each session.",
      tipsAr: "تابع مؤشر أداء أساسي في كل جلسة.",
    },
    profile
  );
}

function createGoalSupplementTask(id: string, blueprint: GoalBlueprint, profile: UserProfile): TaskPoint {
  return sanitizeTask(
    {
      id,
      action: blueprint.supplementTaskEn,
      actionAr: blueprint.supplementTaskAr,
      category: "supplement",
      scienceWhy: "A goal-matched supplement approach can improve execution quality and readiness.",
      scienceWhyAr: "توجيه المكملات حسب الهدف قد يحسن الجاهزية وجودة التنفيذ.",
      visualImpact: "medium",
      tips: "Use only with health-safe dosing.",
      tipsAr: "استخدم فقط بجرعات آمنة لحالتك الصحية.",
    },
    profile
  );
}

function enforceGoalAlignment(protocol: Protocol, query: string, profile: UserProfile): Protocol {
  const blueprint = buildGoalBlueprint(query);
  const next: Protocol = {
    ...protocol,
    title: protocol.title || blueprint.titleEn,
    titleAr: protocol.titleAr || blueprint.titleAr,
    focus:
      Array.isArray(protocol.focus) && protocol.focus.length > 0
        ? protocol.focus
        : blueprint.focusEn,
    focusAr:
      Array.isArray(protocol.focusAr) && protocol.focusAr.length > 0
        ? protocol.focusAr
        : blueprint.focusAr,
    scienceOverview: protocol.scienceOverview || blueprint.overviewEn,
    scienceOverviewAr: protocol.scienceOverviewAr || blueprint.overviewAr,
  };

  if (next.planMode === "weekly" || (Array.isArray(next.weeks) && next.weeks.length > 0 && (!next.days || next.days.length === 0))) {
    next.weeks = (next.weeks || []).map((week) => {
      const taskTexts = week.tasks.map((task) => `${task.action} ${task.actionAr}`).join(" ").toLowerCase();
      const hasGoalTask = matchesGoalAlignment(taskTexts, blueprint.alignmentKeywords);
      const hasSupplement = week.tasks.some((task) => task.category === "supplement");
      const tasks = [...week.tasks];
      if (!hasGoalTask) {
        tasks.push({
          ...createGoalTrainingTask(`w${week.week}-goal-align`, blueprint, profile),
          frequency: blueprint.archetype === "speed_performance" ? "4x/week" : "3x/week",
          frequencyAr: blueprint.archetype === "speed_performance" ? "4 مرات/أسبوع" : "3 مرات/أسبوع",
        });
      }
      if (!hasSupplement && (blueprint.archetype === "speed_performance" || blueprint.archetype === "muscle_gain")) {
        tasks.push({
          ...createGoalSupplementTask(`w${week.week}-supp-align`, blueprint, profile),
          frequency: "3-5x/week",
          frequencyAr: "3-5 مرات/أسبوع",
        });
      }
      return {
        ...week,
        weeklyGoal: week.weeklyGoal || blueprint.weeklyGoalEn,
        weeklyGoalAr: week.weeklyGoalAr || blueprint.weeklyGoalAr,
        tasks,
      };
    });
  } else {
    next.days = (next.days || []).map((day) => {
      const taskTexts = day.tasks.map((task) => `${task.action} ${task.actionAr}`).join(" ").toLowerCase();
      const hasGoalTask = matchesGoalAlignment(taskTexts, blueprint.alignmentKeywords);
      const hasSupplement = day.tasks.some((task) => task.category === "supplement");
      const tasks = [...day.tasks];
      if (!hasGoalTask) {
        tasks.push(createGoalTrainingTask(`d${day.day}-goal-align`, blueprint, profile));
      }
      if (!hasSupplement && (blueprint.archetype === "speed_performance" || blueprint.archetype === "muscle_gain")) {
        tasks.push(createGoalSupplementTask(`d${day.day}-supp-align`, blueprint, profile));
      }
      return {
        ...day,
        dailyGoal: day.dailyGoal || blueprint.dailyGoalEn,
        dailyGoalAr: day.dailyGoalAr || blueprint.dailyGoalAr,
        tasks,
      };
    });
  }

  return next;
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
  const blueprint = buildGoalBlueprint(query);
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  const shape =
    mode === "weekly"
      ? `Output JSON with keys: title,titleAr,subtitle,subtitleAr,focus,focusAr,scienceOverview,scienceOverviewAr,profileFitSummary,profileFitSummaryAr,priorityActions,priorityActionsAr,weeks[].`
      : `Output JSON with keys: title,titleAr,subtitle,subtitleAr,focus,focusAr,scienceOverview,scienceOverviewAr,profileFitSummary,profileFitSummaryAr,priorityActions,priorityActionsAr,days[].`;
  return `Build a realistic ${mode} protocol. JSON only.
Goal: ${query}
GoalWords: ${JSON.stringify(queryWords)}
Locale: ${locale}
DurationDays: ${durationDays}
DurationWeeks: ${durationWeeks}
Profile: ${JSON.stringify(profile)}
Q&A: ${JSON.stringify(qaHistory.slice(0, 6))}
GoalArchetype: ${blueprint.archetype}
GoalBlueprint: ${JSON.stringify({
    focusEn: blueprint.focusEn,
    trainingTaskEn: blueprint.trainingTaskEn,
    nutritionTaskEn: blueprint.nutritionTaskEn,
    recoveryTaskEn: blueprint.recoveryTaskEn,
    supplementTaskEn: blueprint.supplementTaskEn,
    alignmentKeywords: blueprint.alignmentKeywords,
  })}
Rules:
- The user goal may be only 2-4 words: infer hidden intent precisely and keep strong relation to those words.
- Every week/day must include at least one task directly linked to GoalArchetype.
- If GoalArchetype is speed_performance, include sprint/acceleration mechanics and supportive performance nutrition.
- Mention supplements only in safe optional format, and avoid unsafe recommendations.
- No impossible schedules, concise practical output.
- allowed categories wake meal supplement training recovery hydration sleep.
- visualImpact low|medium|high.
${shape}`;
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
      const alignedProtocol = enforceGoalAlignment(protocol, query, profile);
      return NextResponse.json(alignedProtocol);
    } catch {
      continue;
    }
  }

  return NextResponse.json(fallback);
}
