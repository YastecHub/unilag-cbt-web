import type { BootstrapData, Course, LeaderboardRow, Result, Settings, Student, TestSession } from "./types";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
const pending = new Map<string, Promise<unknown>>();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Something went wrong" }));
    throw new Error(body.detail || "Something went wrong");
  }
  return response.json() as Promise<T>;
}

function deduped<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const current = pending.get(key) as Promise<T> | undefined;
  if (current) return current;
  const next = loader().finally(() => pending.delete(key));
  pending.set(key, next);
  return next;
}

function cached<T>(key: string, loader: () => Promise<T>, maxAgeMs: number): Promise<T> {
  const storageKey = `unilag-cache:${key}`;
  const stored = sessionStorage.getItem(storageKey);
  if (stored) {
    const parsed = JSON.parse(stored) as { savedAt: number; value: T };
    if (Date.now() - parsed.savedAt < maxAgeMs) return Promise.resolve(parsed.value);
  }
  return deduped(key, async () => {
    const value = await loader();
    sessionStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), value }));
    return value;
  });
}

function clearLeaderboardCache() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith("unilag-cache:leaderboard:"))
    .forEach((key) => sessionStorage.removeItem(key));
}

export const api = {
  bootstrap: () =>
    cached<BootstrapData>(
      "bootstrap",
      () =>
        request<BootstrapData>("/bootstrap").catch(async () => {
          const [settings, courses] = await Promise.all([request<Settings>("/settings"), request<Course[]>("/courses")]);
          return { settings, courses };
        }),
      5 * 60_000,
    ),
  settings: () => request<Settings>("/settings"),
  courses: () => request<Course[]>("/courses"),
  register: (body: Record<string, unknown>) =>
    request<Student>("/students/register", { method: "POST", body: JSON.stringify(body) }),
  startTest: (studentId: string, durationMinutes: number) =>
    request<TestSession>("/tests/start", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, duration_minutes: durationMinutes }),
    }),
  submitTest: async (attemptId: string, answers: Record<string, string>, timeUsedSeconds: number) => {
    const result = await request<Result>(`/tests/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers: Object.entries(answers).map(([question_id, selected_answer]) => ({ question_id, selected_answer })),
        time_used_seconds: timeUsedSeconds,
      }),
    });
    sessionStorage.setItem(`unilag-result:${attemptId}`, JSON.stringify(result));
    clearLeaderboardCache();
    return result;
  },
  result: (attemptId: string) => {
    const stored = sessionStorage.getItem(`unilag-result:${attemptId}`);
    return stored ? Promise.resolve(JSON.parse(stored) as Result) : request<Result>(`/tests/${attemptId}/result`);
  },
  leaderboard: (query = "") =>
    cached<LeaderboardRow[]>(`leaderboard:${query}`, () => request<LeaderboardRow[]>(`/leaderboard${query}`), 30_000),
  adminLogin: (email: string, password: string) =>
    request<{ access_token: string }>("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  adminDashboard: (token: string) =>
    request<Record<string, number | [string, number][]>>("/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
