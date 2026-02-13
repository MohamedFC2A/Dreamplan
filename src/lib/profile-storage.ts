import { Locale } from "@/lib/i18n";
import { UserProfile } from "@/lib/planner-types";

export const USER_PROFILE_KEY = "user-profile.v1";

export function createDefaultProfile(goal = ""): UserProfile {
  return {
    age: 28,
    sex: "male",
    activityLevel: "moderate",
    primaryGoal: goal,
    injuriesOrConditions: "",
    availableEquipment: "",
    units: "metric",
    heightCm: 175,
    weightKg: 75,
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
