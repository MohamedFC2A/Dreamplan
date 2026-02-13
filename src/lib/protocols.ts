export interface TaskPoint {
  id: string;
  action: string;
  actionAr: string;
  category: "wake" | "meal" | "supplement" | "training" | "recovery" | "hydration" | "sleep";
  scienceWhy: string;
  scienceWhyAr: string;
  visualImpact: "low" | "medium" | "high";
  tips?: string;
  tipsAr?: string;
  exerciseImage?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  titleAr: string;
  theme: string;
  themeAr: string;
  dailyGoal: string;
  dailyGoalAr: string;
  tasks: TaskPoint[];
}

export interface ProgressPoint {
  day: number;
  impact: number;
}

export interface Protocol {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  focus: string[];
  focusAr: string[];
  scienceOverview: string;
  scienceOverviewAr: string;
  progressData: ProgressPoint[];
  days: DayPlan[];
}

import handVeinsData from "@/data/hand-veins.json";
import ronaldoNeckData from "@/data/ronaldo-neck.json";

export const protocols: Record<string, Protocol> = {
  "hand-veins": handVeinsData as unknown as Protocol,
  "ronaldo-neck": ronaldoNeckData as unknown as Protocol,
};

const keywordMap: Record<string, string[]> = {
  "hand-veins": ["vein", "vascularity", "vascular", "hand", "forearm", "عروق", "وريد", "أوعية", "يد", "ساعد"],
  "ronaldo-neck": ["neck", "adam", "apple", "ronaldo", "jawline", "jaw", "throat", "رقبة", "رونالدو", "فك", "حنجرة", "تفاحة"],
};

export function findProtocol(query: string): Protocol | null {
  const lowerQuery = query.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [protocolId, keywords] of Object.entries(keywordMap)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = protocolId;
    }
  }

  if (bestMatch && bestScore > 0) {
    return protocols[bestMatch];
  }

  return null;
}

export function getAllProtocols(): Protocol[] {
  return Object.values(protocols);
}
