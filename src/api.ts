import type { Course, LeaderboardRow, Result, Settings, Student, TestSession } from "./types";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

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

export const api = {
  settings: () => request<Settings>("/settings"),
  courses: () => request<Course[]>("/courses"),
  register: (body: Record<string, unknown>) =>
    request<Student>("/students/register", { method: "POST", body: JSON.stringify(body) }),
  startTest: (studentId: string, durationMinutes: number) =>
    request<TestSession>("/tests/start", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, duration_minutes: durationMinutes }),
    }),
  submitTest: (attemptId: string, answers: Record<string, string>, timeUsedSeconds: number) =>
    request<Result>(`/tests/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers: Object.entries(answers).map(([question_id, selected_answer]) => ({ question_id, selected_answer })),
        time_used_seconds: timeUsedSeconds,
      }),
    }),
  result: (attemptId: string) => request<Result>(`/tests/${attemptId}/result`),
  leaderboard: (query = "") => request<LeaderboardRow[]>(`/leaderboard${query}`),
  adminLogin: (email: string, password: string) =>
    request<{ access_token: string }>("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  adminDashboard: (token: string) =>
    request<Record<string, number | [string, number][]>>("/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
