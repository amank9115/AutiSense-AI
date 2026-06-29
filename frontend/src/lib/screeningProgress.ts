// Crash-safe persistence for an in-progress camera screening.
//
// Why metrics-only: captured frames carry a base64 JPEG (`imageBase64`) which is
// large. Persisting dozens of them risks the localStorage quota, so we strip the
// image before saving. `imageBase64` is optional in the ML payload, so a resumed
// session's frames remain valid for analysis. During a same-tab pause/resume the
// in-memory frames keep their images; the stored copy only matters after a hard
// refresh/crash, where positional resume + metric frames are an acceptable
// fallback to losing the whole session.

export type CapturedFrame = {
  eyeContact: number;
  attentionSpan: number;
  emotionSignals: number;
  gestureAnalysis: number;
  confidence: number;
  imageBase64?: string;
};

export type ScreeningProgress = {
  childId: string;
  moduleIndex: number;
  timeLeft: number;
  frames: CapturedFrame[];
  startedAt: number;
  updatedAt: number;
};

const KEY = "autisense-screening-progress";
// Discard progress older than 24h — a stale half-session shouldn't resurface days later.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function saveScreeningProgress(
  progress: Omit<ScreeningProgress, "updatedAt">,
  now: number,
): void {
  if (typeof window === "undefined") return;
  try {
    // Strip the heavy base64 image to stay well within the storage quota.
    const slim: ScreeningProgress = {
      ...progress,
      updatedAt: now,
      frames: progress.frames.map((f) => ({
        eyeContact: f.eyeContact,
        attentionSpan: f.attentionSpan,
        emotionSignals: f.emotionSignals,
        gestureAnalysis: f.gestureAnalysis,
        confidence: f.confidence,
      })),
    };
    window.localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    // Quota/serialization failure is non-fatal — the live session continues.
  }
}

/** Returns saved progress for `childId` if present, fresh (<24h), and past setup. */
export function loadScreeningProgress(childId: string, now: number): ScreeningProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScreeningProgress;
    if (
      !parsed ||
      parsed.childId !== childId ||
      parsed.moduleIndex < 0 ||
      !Array.isArray(parsed.frames) ||
      now - parsed.updatedAt > MAX_AGE_MS
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Lightweight check used by dashboards to decide whether to show a Resume CTA. */
export function peekScreeningProgress(now: number): { childId: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScreeningProgress;
    if (!parsed || parsed.moduleIndex < 0 || now - parsed.updatedAt > MAX_AGE_MS) return null;
    return { childId: parsed.childId };
  } catch {
    return null;
  }
}

export function clearScreeningProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
