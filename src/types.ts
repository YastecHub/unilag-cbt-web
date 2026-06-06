export type Course = {
  id: string;
  name: string;
  faculty: string;
  utme_subjects: string[];
  final_test_subjects: string[];
};

export type Settings = {
  exam_date: string;
  available_durations: number[];
  total_questions: number;
  max_score: number;
  whatsapp_group_link: string;
};

export type Student = {
  id: string;
  full_name: string;
  utme_score: number;
  course_id: string;
  email?: string;
};

export type Question = {
  id: string;
  subject: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

export type Attempt = {
  id: string;
  duration_selected_minutes: number;
  total_questions: number;
  started_at: string;
};

export type TestSession = {
  attempt: Attempt;
  student: Student;
  course: Course;
  questions: Question[];
};

export type Result = Attempt & {
  score: number;
  max_score: number;
  percentage: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  time_used_seconds: number;
  subject_breakdown: Record<string, { correct: number; total: number }>;
  leaderboard_rank: number;
  total_aspirants: number;
  recommendation: string;
  student: Student;
  course: Course;
};

export type LeaderboardRow = {
  rank: number;
  attempt_id: string;
  student_name: string;
  course: string;
  score: number;
  max_score: number;
  percentage: number;
  time_used_seconds: number;
  submitted_at: string;
};

