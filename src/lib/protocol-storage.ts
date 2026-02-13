import { Protocol } from "@/lib/protocols";
import { PlannerAnswer, UserProfile } from "@/lib/planner-types";

export interface PrivateProtocolEntry {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  detailedDays: number;
  totalDays: number;
  createdAt: string;
  updatedAt: string;
  planMode?: "daily" | "weekly";
  durationWeeks?: number;
  profileSnapshot?: UserProfile;
  qaSummary?: string[];
  qaHistory?: PlannerAnswer[];
  customName?: string;
  protocol: Protocol;
}

interface CreatePrivateProtocolEntryOptions {
  profileSnapshot?: UserProfile;
  qaSummary?: string[];
  qaHistory?: PlannerAnswer[];
}

export const PRIVATE_PROTOCOLS_KEY = "private-protocols.v1";
export const LAST_OPENED_PRIVATE_PROTOCOL_ID_KEY = "private-protocols.v1.last-opened-id";

const LEGACY_SAVED_PROTOCOLS_KEY = "saved-protocols";
const MIGRATION_FLAG_KEY = "private-protocols.v1.migrated";
const SESSION_PROTOCOL_KEY = "ai-protocol";
const MAX_PRIVATE_PROTOCOLS = 25;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeParseArray(raw: string | null): any[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clampProtocolSize(entries: PrivateProtocolEntry[]): PrivateProtocolEntry[] {
  return entries
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_PRIVATE_PROTOCOLS);
}

function persist(entries: PrivateProtocolEntry[]): PrivateProtocolEntry[] {
  if (!isBrowser()) return entries;
  const clamped = clampProtocolSize(entries);
  localStorage.setItem(PRIVATE_PROTOCOLS_KEY, JSON.stringify(clamped));
  return clamped;
}

function sanitizeEntry(raw: any): PrivateProtocolEntry | null {
  if (!raw || typeof raw !== "object" || !raw.protocol || typeof raw.protocol !== "object") {
    return null;
  }

  const protocol = raw.protocol as Protocol;
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title : protocol.title;
  const titleAr = typeof raw.titleAr === "string" && raw.titleAr.trim() ? raw.titleAr : protocol.titleAr || title;
  const subtitle =
    typeof raw.subtitle === "string" && raw.subtitle.trim() ? raw.subtitle : protocol.subtitle || "";
  const subtitleAr =
    typeof raw.subtitleAr === "string" && raw.subtitleAr.trim()
      ? raw.subtitleAr
      : protocol.subtitleAr || subtitle;
  const detailedDays =
    typeof raw.detailedDays === "number"
      ? raw.detailedDays
      : Array.isArray(protocol.days)
      ? protocol.days.length
      : 0;
  const totalDays =
    typeof raw.totalDays === "number"
      ? raw.totalDays
      : typeof protocol.durationDays === "number"
      ? protocol.durationDays
      : Array.isArray(protocol.progressData)
      ? protocol.progressData.length
      : detailedDays;
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt.trim() ? raw.createdAt : new Date().toISOString();
  const updatedAt =
    typeof raw.updatedAt === "string" && raw.updatedAt.trim() ? raw.updatedAt : createdAt;
  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id
      : `pp-${new Date(createdAt).getTime()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    title,
    titleAr,
    subtitle,
    subtitleAr,
    detailedDays: Math.max(0, detailedDays),
    totalDays: Math.max(0, totalDays),
    createdAt,
    updatedAt,
    planMode:
      raw.planMode === "weekly" || raw.planMode === "daily"
        ? raw.planMode
        : protocol.planMode,
    durationWeeks:
      typeof raw.durationWeeks === "number"
        ? Math.max(0, raw.durationWeeks)
        : typeof protocol.durationWeeks === "number"
        ? Math.max(0, protocol.durationWeeks)
        : undefined,
    profileSnapshot:
      raw.profileSnapshot && typeof raw.profileSnapshot === "object"
        ? (raw.profileSnapshot as UserProfile)
        : undefined,
    qaSummary: Array.isArray(raw.qaSummary)
      ? raw.qaSummary.filter((item: unknown): item is string => typeof item === "string")
      : Array.isArray(protocol.qaSummary)
      ? protocol.qaSummary
      : undefined,
    qaHistory: Array.isArray(raw.qaHistory)
      ? raw.qaHistory.filter((item: unknown): item is PlannerAnswer => Boolean(item && typeof item === "object"))
      : undefined,
    customName: typeof raw.customName === "string" ? raw.customName : undefined,
    protocol,
  };
}

function sanitizeEntries(rawEntries: any[]): PrivateProtocolEntry[] {
  return rawEntries.map(sanitizeEntry).filter((entry): entry is PrivateProtocolEntry => Boolean(entry));
}

function legacyToPrivateEntry(raw: any): PrivateProtocolEntry | null {
  const sanitized = sanitizeEntry({
    id: typeof raw?.id === "string" ? raw.id : undefined,
    title: raw?.title,
    titleAr: raw?.titleAr,
    subtitle: raw?.subtitle,
    subtitleAr: raw?.subtitleAr,
    detailedDays: raw?.daysCount,
    totalDays: raw?.totalDays,
    createdAt: raw?.createdAt,
    updatedAt: raw?.createdAt,
    protocol: raw?.protocol,
  });
  return sanitized;
}

export function migrateLegacySavedProtocols(): PrivateProtocolEntry[] {
  if (!isBrowser()) return [];

  const migrated = localStorage.getItem(MIGRATION_FLAG_KEY) === "1";
  const current = getPrivateProtocols();
  if (migrated) return current;

  if (current.length > 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, "1");
    return current;
  }

  const legacyRaw = safeParseArray(localStorage.getItem(LEGACY_SAVED_PROTOCOLS_KEY));
  const converted = legacyRaw
    .map(legacyToPrivateEntry)
    .filter((entry): entry is PrivateProtocolEntry => Boolean(entry));

  localStorage.setItem(MIGRATION_FLAG_KEY, "1");
  if (converted.length === 0) return [];

  return persist(converted);
}

export function getPrivateProtocols(): PrivateProtocolEntry[] {
  if (!isBrowser()) return [];
  const rawEntries = safeParseArray(localStorage.getItem(PRIVATE_PROTOCOLS_KEY));
  const sanitized = sanitizeEntries(rawEntries);

  if (sanitized.length !== rawEntries.length) {
    return persist(sanitized);
  }

  return clampProtocolSize(sanitized);
}

export function createPrivateProtocolEntry(
  protocol: Protocol,
  options?: CreatePrivateProtocolEntryOptions
): PrivateProtocolEntry {
  const now = new Date().toISOString();
  const detailedDays = Array.isArray(protocol.days)
    ? protocol.days.length
    : Array.isArray(protocol.weeks)
    ? protocol.weeks.length
    : 0;
  const totalDays = Array.isArray(protocol.progressData) ? protocol.progressData.length : detailedDays;
  const normalizedTotalDays =
    typeof protocol.durationDays === "number" && protocol.durationDays > 0 ? protocol.durationDays : totalDays;

  return {
    id: `pp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: protocol.title || "AI Protocol",
    titleAr: protocol.titleAr || protocol.title || "بروتوكول ذكاء اصطناعي",
    subtitle: protocol.subtitle || "",
    subtitleAr: protocol.subtitleAr || protocol.subtitle || "",
    detailedDays,
    totalDays: normalizedTotalDays,
    createdAt: now,
    updatedAt: now,
    planMode: protocol.planMode,
    durationWeeks: protocol.durationWeeks,
    profileSnapshot: options?.profileSnapshot,
    qaSummary:
      Array.isArray(options?.qaSummary) && options?.qaSummary.length > 0
        ? options.qaSummary
        : Array.isArray(protocol.qaSummary)
        ? protocol.qaSummary
        : undefined,
    qaHistory: Array.isArray(options?.qaHistory) && options?.qaHistory.length > 0 ? options.qaHistory : undefined,
    protocol,
  };
}

export function upsertPrivateProtocol(entry: PrivateProtocolEntry): PrivateProtocolEntry[] {
  const current = getPrivateProtocols();
  const next = [entry, ...current.filter((item) => item.id !== entry.id)];
  return persist(next);
}

export function deletePrivateProtocol(id: string): PrivateProtocolEntry[] {
  const current = getPrivateProtocols();
  const next = current.filter((item) => item.id !== id);
  if (isBrowser()) {
    localStorage.setItem(PRIVATE_PROTOCOLS_KEY, JSON.stringify(next));
    if (getLastOpenedPrivateProtocolId() === id) {
      localStorage.removeItem(LAST_OPENED_PRIVATE_PROTOCOL_ID_KEY);
    }
  }
  return next;
}

export function renamePrivateProtocol(id: string, customName: string): PrivateProtocolEntry[] {
  const next = getPrivateProtocols().map((entry) => {
    if (entry.id !== id) return entry;
    return {
      ...entry,
      customName: customName.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
  });
  return persist(next);
}

export function clearPrivateProtocols(): PrivateProtocolEntry[] {
  if (!isBrowser()) return [];
  localStorage.setItem(PRIVATE_PROTOCOLS_KEY, JSON.stringify([]));
  localStorage.removeItem(LAST_OPENED_PRIVATE_PROTOCOL_ID_KEY);
  return [];
}

export function setLastOpenedPrivateProtocolId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_OPENED_PRIVATE_PROTOCOL_ID_KEY, id);
}

export function getLastOpenedPrivateProtocolId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LAST_OPENED_PRIVATE_PROTOCOL_ID_KEY);
}

export function findPrivateProtocolById(id: string): PrivateProtocolEntry | null {
  return getPrivateProtocols().find((entry) => entry.id === id) || null;
}

export function openPrivateProtocolEntry(entry: PrivateProtocolEntry): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(SESSION_PROTOCOL_KEY, JSON.stringify(entry.protocol));
  setLastOpenedPrivateProtocolId(entry.id);
}
