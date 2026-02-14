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

export function readStoredProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as UserProfile;
  } catch {
    return null;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
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
