import { PlannerAnswer, UserProfile } from "@/lib/planner-types";
import {
  createPrivateProtocolEntry,
  getPrivateProtocols,
  openPrivateProtocolEntry,
  upsertPrivateProtocol,
} from "@/lib/protocol-storage";
import { Protocol } from "@/lib/protocols";

type Locale = "ar" | "en";
type TaskStatus = "idle" | "running" | "success" | "error";

const TASK_KEY = "generation-task.v1";
const PLANNER_QA_KEY = "planner-qa.v1";
const PLANNER_SESSION_KEY = "planner-session.v1";

export interface GenerationTaskInput {
  query: string;
  locale: Locale;
  durationDays: number;
  planModeEnabled: boolean;
  profile: UserProfile;
  qaHistory: PlannerAnswer[];
  qaSummary?: string[];
}

export interface GenerationTaskSnapshot {
  taskId: string | null;
  status: TaskStatus;
  query: string;
  locale: Locale;
  startedAt: string | null;
  finishedAt: string | null;
  entryId: string | null;
  error: string | null;
  code: string | null;
}

const DEFAULT_SNAPSHOT: GenerationTaskSnapshot = {
  taskId: null,
  status: "idle",
  query: "",
  locale: "ar",
  startedAt: null,
  finishedAt: null,
  entryId: null,
  error: null,
  code: null,
};

class GenerationError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "GenerationError";
    this.code = code;
  }
}

let activePromise: Promise<GenerationTaskSnapshot> | null = null;
let snapshot: GenerationTaskSnapshot = loadSnapshot();
const listeners = new Set<(state: GenerationTaskSnapshot) => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadSnapshot(): GenerationTaskSnapshot {
  if (!isBrowser()) return { ...DEFAULT_SNAPSHOT };
  try {
    const raw = localStorage.getItem(TASK_KEY);
    if (!raw) return { ...DEFAULT_SNAPSHOT };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SNAPSHOT };
    return {
      ...DEFAULT_SNAPSHOT,
      ...parsed,
    } as GenerationTaskSnapshot;
  } catch {
    return { ...DEFAULT_SNAPSHOT };
  }
}

function persistSnapshot(next: GenerationTaskSnapshot): GenerationTaskSnapshot {
  snapshot = next;
  if (isBrowser()) {
    localStorage.setItem(TASK_KEY, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener(next));
  return next;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function getGenerationTaskSnapshot(): GenerationTaskSnapshot {
  return snapshot;
}

export function subscribeGenerationTask(
  listener: (state: GenerationTaskSnapshot) => void
): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

export function resetGenerationTask(): void {
  if (!isBrowser()) return;
  activePromise = null;
  persistSnapshot({ ...DEFAULT_SNAPSHOT });
}

export function hasRunningGenerationTask(): boolean {
  return snapshot.status === "running";
}

async function parseGenerationResponse(res: Response): Promise<Protocol> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.error) {
    throw new GenerationError(payload?.error || "Failed to generate protocol", payload?.code);
  }
  return payload as Protocol;
}

function completeWithSuccess(
  taskId: string,
  input: GenerationTaskInput,
  protocol: Protocol
): GenerationTaskSnapshot {
  const entry = createPrivateProtocolEntry(protocol, {
    profileSnapshot: input.profile,
    qaHistory: input.qaHistory,
    qaSummary: input.qaSummary || [],
  });
  upsertPrivateProtocol(entry);
  openPrivateProtocolEntry(entry);
  if (isBrowser()) {
    localStorage.removeItem(PLANNER_QA_KEY);
    localStorage.removeItem(PLANNER_SESSION_KEY);
  }
  return persistSnapshot({
    taskId,
    status: "success",
    query: input.query,
    locale: input.locale,
    startedAt: snapshot.startedAt,
    finishedAt: nowIso(),
    entryId: entry.id,
    error: null,
    code: null,
  });
}

function completeWithError(taskId: string, input: GenerationTaskInput, error: unknown): GenerationTaskSnapshot {
  const message =
    error instanceof GenerationError
      ? error.message
      : error instanceof Error
      ? error.message
      : "Failed to generate protocol";
  const code = error instanceof GenerationError ? error.code || null : null;
  return persistSnapshot({
    taskId,
    status: "error",
    query: input.query,
    locale: input.locale,
    startedAt: snapshot.startedAt,
    finishedAt: nowIso(),
    entryId: null,
    error: message,
    code,
  });
}

export async function startGenerationTask(input: GenerationTaskInput): Promise<GenerationTaskSnapshot> {
  if (activePromise) return activePromise;

  const taskId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  persistSnapshot({
    taskId,
    status: "running",
    query: input.query,
    locale: input.locale,
    startedAt: nowIso(),
    finishedAt: null,
    entryId: null,
    error: null,
    code: null,
  });

  activePromise = (async () => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input.query.trim(),
          locale: input.locale,
          durationDays: input.durationDays,
          planModeEnabled: input.planModeEnabled,
          profile: input.profile,
          qaHistory: input.qaHistory,
        }),
      });
      const protocol = await parseGenerationResponse(res);
      return completeWithSuccess(taskId, input, protocol);
    } catch (error) {
      const errored = completeWithError(taskId, input, error);
      throw new GenerationError(errored.error || "Failed to generate protocol", errored.code || undefined);
    } finally {
      activePromise = null;
    }
  })();

  return activePromise;
}

export function getLatestPrivateProtocols() {
  return getPrivateProtocols();
}
