export type ProAccessMode = "none" | "demo";

export interface ProAccessState {
  enabled: boolean;
  mode: ProAccessMode;
  updatedAt: string | null;
}

export const PRO_ACCESS_KEY = "pro-access.v1";

const DEFAULT_STATE: ProAccessState = {
  enabled: false,
  mode: "none",
  updatedAt: null,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getProAccessState(): ProAccessState {
  if (!isBrowser()) return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(PRO_ACCESS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_STATE };
    const enabled = Boolean(parsed.enabled);
    const mode: ProAccessMode = parsed.mode === "demo" ? "demo" : "none";
    const updatedAt =
      typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
        ? parsed.updatedAt
        : null;
    return { enabled, mode, updatedAt };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function hasProAccess(): boolean {
  return getProAccessState().enabled;
}

export function setProAccessDemo(enabled: boolean): ProAccessState {
  const next: ProAccessState = {
    enabled,
    mode: enabled ? "demo" : "none",
    updatedAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    localStorage.setItem(PRO_ACCESS_KEY, JSON.stringify(next));
  }
  return next;
}

export function toggleProAccessDemo(): ProAccessState {
  const current = getProAccessState();
  return setProAccessDemo(!current.enabled);
}
