export type MeasurementUnits = "metric" | "imperial";

export interface UserProfile {
  age: number;
  sex: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "athlete";
  primaryGoal: string;
  injuriesOrConditions: string;
  availableEquipment: string;
  units: MeasurementUnits;
  heightCm: number;
  weightKg: number;
  sleepHours?: number;
}

export interface PlannerQuestion {
  id: string;
  question: string;
  questionAr: string;
  inputType: "single_choice" | "multi_choice" | "text";
  required: boolean;
  options?: Array<{
    value: string;
    label: string;
    labelAr: string;
  }>;
  reasoningHint?: string;
  reasoningHintAr?: string;
}

export interface PlannerAnswer {
  questionId: string;
  value: string;
  label?: string;
}

export interface PlannerSessionState {
  query: string;
  locale: "ar" | "en";
  durationDays: number;
  profile: UserProfile;
  qaHistory: PlannerAnswer[];
}
