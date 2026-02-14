import { Locale } from "@/lib/i18n";
import { UserProfile } from "@/lib/planner-types";

export const USER_PROFILE_KEY = "user-profile.v1";

export function createDefaultProfile(goal = ""): UserProfile {
  return {
    age: 28,
    sex: "male",
    activityLevel: "moderate",
    primaryGoal: goal,
    injuriesOrConditions: "none",
    availableEquipment: "bodyweight",
    units: "metric",
    heightCm: 175,
    weightKg: 75,
    sleepHours: 7,
  };
}

function normalizeStringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function inferActivityLevelFromProfile(profile: Pick<UserProfile, "age" | "weightKg" | "heightCm" | "sleepHours" | "injuriesOrConditions">): UserProfile["activityLevel"] {
  const heightM = Math.max(0.0001, profile.heightCm / 100);
  const bmi = profile.weightKg / (heightM * heightM);
  const sleep = profile.sleepHours ?? 7;
  const condition = (profile.injuriesOrConditions || "").toLowerCase();

  if (sleep < 6) return "light";
  if (condition !== "none" && condition !== "لا يوجد") return "light";
  if (bmi >= 33 || profile.age >= 55) return "sedentary";
  if (bmi >= 27 || profile.age >= 45) return "light";
  if (bmi <= 22 && sleep >= 7.5 && profile.age < 35) return "active";
  return "moderate";
}

export function normalizeStoredProfile(raw: Partial<UserProfile> | null | undefined): UserProfile {
  const base = createDefaultProfile("");
  const merged: UserProfile = {
    age: Math.round(toFiniteNumber(raw?.age, base.age)),
    sex: raw?.sex === "female" ? "female" : "male",
    activityLevel:
      raw?.activityLevel === "sedentary" ||
      raw?.activityLevel === "light" ||
      raw?.activityLevel === "moderate" ||
      raw?.activityLevel === "active" ||
      raw?.activityLevel === "athlete"
        ? raw.activityLevel
        : base.activityLevel,
    primaryGoal: normalizeStringValue(raw?.primaryGoal, ""),
    injuriesOrConditions: normalizeStringValue(raw?.injuriesOrConditions, "none"),
    availableEquipment: normalizeStringValue(raw?.availableEquipment, "bodyweight"),
    units: "metric",
    heightCm: Math.round(toFiniteNumber(raw?.heightCm, base.heightCm) * 10) / 10,
    weightKg: Math.round(toFiniteNumber(raw?.weightKg, base.weightKg) * 10) / 10,
    sleepHours: Math.round(toFiniteNumber(raw?.sleepHours, base.sleepHours || 7) * 10) / 10,
  };
  merged.activityLevel = inferActivityLevelFromProfile(merged);
  return merged;
}

export function readStoredProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return normalizeStoredProfile(parsed as Partial<UserProfile>);
  } catch {
    return null;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(normalizeStoredProfile(profile)));
}

export function validateProfile(profile: UserProfile, locale: Locale): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(profile.age) || profile.age < 13 || profile.age > 90) {
    errors.push(locale === "ar" ? "العمر يجب أن يكون بين 13 و90." : "Age must be between 13 and 90.");
  }
  if (!Number.isFinite(profile.heightCm) || profile.heightCm < 120 || profile.heightCm > 230) {
    errors.push(locale === "ar" ? "الطول غير صالح." : "Height is out of valid range.");
  }
  if (!Number.isFinite(profile.weightKg) || profile.weightKg < 35 || profile.weightKg > 250) {
    errors.push(locale === "ar" ? "الوزن غير صالح." : "Weight is out of valid range.");
  }
  if (!profile.sex) errors.push(locale === "ar" ? "اختر الجنس." : "Select sex.");
  if (!profile.activityLevel) errors.push(locale === "ar" ? "اختر مستوى النشاط." : "Select activity level.");
  if (!profile.injuriesOrConditions.trim()) {
    errors.push(locale === "ar" ? "اكتب الإصابات/الحالة (أو none)." : "Injuries/conditions field is required.");
  }
  if (!profile.availableEquipment.trim()) {
    errors.push(locale === "ar" ? "اكتب المعدات المتاحة." : "Available equipment is required.");
  }
  return errors;
}

export interface ProfileReadinessBreakdown {
  score: number;
  validationScore: number;
  personalizationScore: number;
}

export function computeProfileReadiness(profile: UserProfile): ProfileReadinessBreakdown {
  const defaults = createDefaultProfile("");

  let validationScore = 0;
  if (Number.isFinite(profile.age) && profile.age >= 13 && profile.age <= 90) validationScore += 8;
  if (profile.sex === "male" || profile.sex === "female") validationScore += 8;
  if (Number.isFinite(profile.heightCm) && profile.heightCm >= 120 && profile.heightCm <= 230) validationScore += 10;
  if (Number.isFinite(profile.weightKg) && profile.weightKg >= 35 && profile.weightKg <= 250) validationScore += 10;
  if (Number.isFinite(profile.sleepHours) && (profile.sleepHours || 0) >= 5 && (profile.sleepHours || 0) <= 10) validationScore += 8;
  if ((profile.injuriesOrConditions || "").trim().length > 0) validationScore += 8;
  if ((profile.availableEquipment || "").trim().length > 0) validationScore += 8;
  if (profile.activityLevel) validationScore += 8;

  let personalizationScore = 0;
  if (Math.abs(profile.age - defaults.age) >= 2) personalizationScore += 10;
  if (Math.abs(profile.heightCm - defaults.heightCm) >= 3) personalizationScore += 10;
  if (Math.abs(profile.weightKg - defaults.weightKg) >= 3) personalizationScore += 10;
  if (Math.abs((profile.sleepHours || 7) - (defaults.sleepHours || 7)) >= 0.5) personalizationScore += 4;

  const condition = (profile.injuriesOrConditions || "").toLowerCase();
  const hasConditionDetails =
    condition &&
    condition !== "none" &&
    condition !== "لا يوجد" &&
    condition.trim().length > 0;
  if (hasConditionDetails) personalizationScore += 6;

  const score = Math.max(0, Math.min(100, validationScore + personalizationScore));
  return { score, validationScore, personalizationScore };
}

export function isProfileComplete(profile: UserProfile | null, locale: Locale): boolean {
  if (!profile) return false;
  return validateProfile(profile, locale).length === 0;
}

export function toDisplayHeight(profile: UserProfile): number {
  return profile.units === "metric" ? profile.heightCm : profile.heightCm / 2.54;
}

export function toDisplayWeight(profile: UserProfile): number {
  return profile.units === "metric" ? profile.weightKg : profile.weightKg * 2.2046226218;
}

export function withConvertedHeight(profile: UserProfile, displayHeight: number): UserProfile {
  const heightCm = profile.units === "metric" ? displayHeight : displayHeight * 2.54;
  return { ...profile, heightCm: Math.round(heightCm * 10) / 10 };
}

export function withConvertedWeight(profile: UserProfile, displayWeight: number): UserProfile {
  const weightKg = profile.units === "metric" ? displayWeight : displayWeight / 2.2046226218;
  return { ...profile, weightKg: Math.round(weightKg * 10) / 10 };
}

export interface MetabolicSummary {
  bmi: number;
  bmiCategory: "underweight" | "normal" | "overweight" | "obesity";
  bmr: number;
  tdee: number;
  targetCalories: { min: number; max: number };
  proteinRangeG: { min: number; max: number };
  hydrationMl: number;
  healthyWeightRangeKg: { min: number; max: number };
  weightDeltaKg: number;
}

function activityMultiplier(level: UserProfile["activityLevel"]): number {
  switch (level) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    case "athlete":
      return 1.9;
    default:
      return 1.55;
  }
}

export function classifyGoal(primaryGoal: string): "fat_loss" | "muscle_gain" | "maintenance" {
  const goal = primaryGoal.toLowerCase();
  if (
    goal.includes("fat") ||
    goal.includes("lose") ||
    goal.includes("cut") ||
    goal.includes("lean") ||
    goal.includes("دهون") ||
    goal.includes("تنشيف") ||
    goal.includes("خسارة")
  ) {
    return "fat_loss";
  }
  if (
    goal.includes("muscle") ||
    goal.includes("bulk") ||
    goal.includes("mass") ||
    goal.includes("gain") ||
    goal.includes("عضل") ||
    goal.includes("تضخيم") ||
    goal.includes("كتلة")
  ) {
    return "muscle_gain";
  }
  return "maintenance";
}

export function getMetabolicSummary(profile: UserProfile): MetabolicSummary {
  const heightM = profile.heightCm / 100;
  const bmiRaw = profile.weightKg / Math.max(0.0001, heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  let bmiCategory: MetabolicSummary["bmiCategory"] = "normal";
  if (bmi < 18.5) bmiCategory = "underweight";
  else if (bmi < 25) bmiCategory = "normal";
  else if (bmi < 30) bmiCategory = "overweight";
  else bmiCategory = "obesity";

  const bmrRaw =
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    (profile.sex === "male" ? 5 : -161);
  const bmr = Math.round(bmrRaw);
  const tdee = Math.round(bmr * activityMultiplier(profile.activityLevel));

  const goalClass = classifyGoal(profile.primaryGoal || "");
  let targetMin = tdee;
  let targetMax = tdee;
  if (goalClass === "fat_loss") {
    targetMin = Math.round(tdee * 0.8);
    targetMax = Math.round(tdee * 0.9);
  } else if (goalClass === "muscle_gain") {
    targetMin = Math.round(tdee * 1.05);
    targetMax = Math.round(tdee * 1.15);
  } else {
    targetMin = Math.round(tdee * 0.95);
    targetMax = Math.round(tdee * 1.05);
  }

  const proteinPerKgMin = goalClass === "muscle_gain" ? 1.8 : goalClass === "fat_loss" ? 1.9 : 1.6;
  const proteinPerKgMax = goalClass === "muscle_gain" ? 2.3 : goalClass === "fat_loss" ? 2.4 : 2.0;
  const proteinRangeG = {
    min: Math.round(profile.weightKg * proteinPerKgMin),
    max: Math.round(profile.weightKg * proteinPerKgMax),
  };

  const hydrationMl = Math.round(profile.weightKg * 35);
  const healthyWeightRangeKg = {
    min: Math.round(18.5 * heightM * heightM),
    max: Math.round(24.9 * heightM * heightM),
  };
  const healthyMidpoint = (healthyWeightRangeKg.min + healthyWeightRangeKg.max) / 2;
  const weightDeltaKg = Math.round((profile.weightKg - healthyMidpoint) * 10) / 10;

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    targetCalories: { min: targetMin, max: targetMax },
    proteinRangeG,
    hydrationMl,
    healthyWeightRangeKg,
    weightDeltaKg,
  };
}
