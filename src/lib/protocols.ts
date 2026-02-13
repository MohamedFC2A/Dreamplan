import handVeinsData from "@/data/hand-veins.json";
import ronaldoNeckData from "@/data/ronaldo-neck.json";

export interface ScheduleEntry {
  time: string;
  category: "wake" | "meal" | "supplement" | "training" | "recovery" | "hydration" | "sleep";
  action: string;
  scienceWhy: string;
  visualImpact: "low" | "medium" | "high";
}

export interface DayPlan {
  day: number;
  title: string;
  theme: string;
  schedule: ScheduleEntry[];
}

export interface ProgressPoint {
  day: number;
  impact: number;
}

export interface Protocol {
  id: string;
  title: string;
  subtitle: string;
  focus: string[];
  scienceOverview: string;
  progressData: ProgressPoint[];
  days: DayPlan[];
}

export const protocols: Record<string, Protocol> = {
  "hand-veins": handVeinsData as Protocol,
  "ronaldo-neck": ronaldoNeckData as Protocol,
};

const keywordMap: Record<string, string[]> = {
  "hand-veins": ["vein", "vascularity", "vascular", "hand", "forearm"],
  "ronaldo-neck": ["neck", "adam", "apple", "ronaldo", "jawline", "jaw", "throat"],
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
