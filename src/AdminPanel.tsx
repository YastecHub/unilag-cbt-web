import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3, BookOpen, ChevronRight, CirclePlus, FileUp, GraduationCap, LayoutDashboard,
  LoaderCircle, LogOut, Pencil, Save, Settings as SettingsIcon, Trash2, Trophy, Users, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "./api";
import type { AdminAttempt, AdminQuestion, Course, LeaderboardRow, Settings, Student } from "./types";

type Tab = "overview" | "questions" | "courses" | "students" | "results" | "leaderboard" | "settings";
type Stats = Record<string, number | [string, number][]>;

const emptyQuestion: Omit<AdminQuestion, "id"> = {
  subject: "", topic: "", question: "", option_a: "", option_b: "", option_c: "",
  option_d: "", correct_answer: "A", explanation: "", difficulty: "medium", year: "",
};
const emptyCourse: Course = { id: "", name: "", faculty: "", utme_subjects: [], final_test_subjects: [], is_active: true };

function Brand() {
  return <Link to="/" className="brand"><span className="brand-mark"><GraduationCap /></span><span>UNILAG<b>PREP</b></span></Link>;
}

function LoadingRows({ count = 6 }: { count?: number }) {
  return <div className="admin-loading-list">{Array.from({ length: count }, (_, i) => <div className="skeleton skeleton-table-row" key={i} />)}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="admin-empty"><p>{text}</p></div>;
}

export default function AdminPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats>();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<AdminAttempt[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingQuestion, setEditingQuestion] = useState<string>();
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [courseForm, setCourseForm] = useState<Course>(emptyCourse);
  const [editingCourse, setEditingCourse] = useState<string>();
  const [showCourseForm, setShowCourseForm] = useState(false);

  const load = async (nextTab: Tab) => {
    setLoading(true); setNotice("");
    try {
      if (nextTab === "overview") setStats(await api.adminDashboard(token));
      if (nextTab === "questions") setQuestions(await api.adminQuestions(token));
      if (nextTab === "courses") setCourses(await api.adminCourses(token));
      if (nextTab === "students") setStudents(await api.adminStudents(token));
      if (nextTab === "results") setAttempts(await api.adminAttempts(token));
      if (nextTab === "leaderboard") setLeaders(await api.adminLeaderboard(token));
      if (nextTab === "settings") setSettings(await api.adminSettings(token));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load this section.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(tab); }, [tab]);

  const navigate = (next: Tab) => { setSearch(""); setTab(next); };
  const filteredQuestions = useMemo(() => questions.filter((item) => `${item.subject} ${item.topic} ${item.question}`.toLowerCase().includes(search.toLowerCase())), [questions, search]);
  const filteredCourses = useMemo(() => courses.filter((item) => `${item.name} ${item.faculty}`.toLowerCase().includes(search.toLowerCase())), [courses, search]);
  const filteredStudents = useMemo(() => students.filter((item) => `${item.full_name} ${item.email || ""}`.toLowerCase().includes(search.toLowerCase())), [students, search]);

  const saveQuestion = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice("");
    try {
      if (editingQuestion) await api.updateQuestion(token, editingQuestion, questionForm);
      else await api.addQuestion(token, questionForm);
      setQuestionForm(emptyQuestion); setEditingQuestion(undefined); setShowQuestionForm(false);
      setNotice("Question saved successfully."); await load("questions");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save question."); }
    finally { setSaving(false); }
  };

  const saveCourse = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice("");
    try {
      const general = ["English Language", "Mathematics", "General Paper / Current Affairs"];
      const payload = { ...courseForm, id: courseForm.id || courseForm.name.toLowerCase().replaceAll(" ", "-"), final_test_subjects: [...new Set([...general, ...courseForm.utme_subjects])] };
      if (editingCourse) await api.updateCourse(token, editingCourse, payload);
      else await api.addCourse(token, payload);
      setCourseForm(emptyCourse); setEditingCourse(undefined); setShowCourseForm(false);
      setNotice("Course saved successfully."); await load("courses");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save course."); }
    finally { setSaving(false); }
  };

  const navItems: [Tab, typeof LayoutDashboard, string][] = [
    ["overview", LayoutDashboard, "Overview"], ["questions", BookOpen, "Questions"],
    ["courses", GraduationCap, "Courses"], ["students", Users, "Students"],
    ["results", BarChart3, "Results"], ["leaderboard", Trophy, "Leaderboard"],
    ["settings", SettingsIcon, "Settings"],
  ];
  const titles: Record<Tab, string> = { overview: "Dashboard overview", questions: "Question bank", courses: "Course management", students: "Registered students", results: "Test results", leaderboard: "Leaderboard", settings: "Platform settings" };

  return <div className="admin-shell">
    <div className="admin-mobile-bar"><Brand /><button onClick={onLogout}><LogOut />Sign out</button></div>
    <aside className="admin-sidebar"><Brand /><nav>{navItems.map(([id, Icon, label]) => <button className={tab === id ? "active" : ""} onClick={() => navigate(id)} key={id}><Icon />{label}</button>)}</nav><button onClick={onLogout}>Sign out</button></aside>
    <main className="admin-main">
      <div className="admin-top"><div><p>Admin workspace</p><h1>{titles[tab]}</h1></div><Link className="button outline" to="/">View portal</Link></div>
      <div className="admin-mobile-tabs">{navItems.map(([id, Icon, label]) => <button className={tab === id ? "active" : ""} onClick={() => navigate(id)} key={id}><Icon />{label}</button>)}</div>
      {notice && <div className="admin-notice">{notice}<button onClick={() => setNotice("")}><X /></button></div>}

      {tab === "overview" && (loading ? <LoadingRows count={4} /> : <Overview stats={stats} navigate={navigate} />)}
      {tab === "questions" && <section className="admin-section">
        <div className="admin-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." /><label className="button outline file-button"><FileUp />Import CSV<input type="file" accept=".csv" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setSaving(true); try { const result = await api.uploadQuestions(token, file); setNotice(`${result.created} questions imported${result.errors.length ? `, ${result.errors.length} errors` : ""}.`); await load("questions"); } catch (err) { setNotice(err instanceof Error ? err.message : "Upload failed."); } finally { setSaving(false); e.target.value = ""; } }} /></label><button className="button" onClick={() => { setQuestionForm(emptyQuestion); setEditingQuestion(undefined); setShowQuestionForm(true); }}><CirclePlus />Add question</button></div>
        {showQuestionForm && <QuestionForm value={questionForm} setValue={setQuestionForm} onSubmit={saveQuestion} onClose={() => setShowQuestionForm(false)} saving={saving} />}
        {loading ? <LoadingRows /> : filteredQuestions.length ? <div className="admin-list">{filteredQuestions.map((item) => <article className="admin-list-item" key={item.id}><div><span className="item-tag">{item.subject}</span><h3>{item.question}</h3><p>{item.topic || "No topic"} · Answer {item.correct_answer}</p></div><div className="item-actions"><button onClick={() => { setQuestionForm({ ...item }); setEditingQuestion(item.id); setShowQuestionForm(true); }}><Pencil />Edit</button><button className="danger-action" onClick={async () => { if (!confirm("Delete this question?")) return; await api.deleteQuestion(token, item.id); setQuestions((all) => all.filter((q) => q.id !== item.id)); }}><Trash2 />Delete</button></div></article>)}</div> : <Empty text="No questions found." />}
      </section>}

      {tab === "courses" && <section className="admin-section">
        <div className="admin-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." /><button className="button" onClick={() => { setCourseForm(emptyCourse); setEditingCourse(undefined); setShowCourseForm(true); }}><CirclePlus />Add course</button></div>
        {showCourseForm && <CourseForm value={courseForm} setValue={setCourseForm} onSubmit={saveCourse} onClose={() => setShowCourseForm(false)} saving={saving} />}
        {loading ? <LoadingRows /> : filteredCourses.length ? <div className="admin-list">{filteredCourses.map((item) => <article className="admin-list-item" key={item.id}><div><span className="item-tag">{item.faculty}</span><h3>{item.name}</h3><p>{item.utme_subjects.join(", ")}</p></div><div className="item-actions"><button onClick={() => { setCourseForm({ ...item }); setEditingCourse(item.id); setShowCourseForm(true); }}><Pencil />Edit</button><button className="danger-action" onClick={async () => { if (!confirm("Delete this course? Students linked to it may prevent deletion.")) return; try { await api.deleteCourse(token, item.id); setCourses((all) => all.filter((c) => c.id !== item.id)); } catch (err) { setNotice(err instanceof Error ? err.message : "Delete failed."); } }}><Trash2 />Delete</button></div></article>)}</div> : <Empty text="No courses found." />}
      </section>}

      {tab === "students" && <section className="admin-section"><div className="admin-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." /></div>{loading ? <LoadingRows /> : <AdminTable headers={["Name", "UTME", "Email", "WhatsApp"]} rows={filteredStudents.map((s) => [s.full_name, s.utme_score, s.email || "—", s.whatsapp_number || "—"])} empty="No students registered." />}</section>}
      {tab === "results" && <section className="admin-section">{loading ? <LoadingRows /> : <AdminTable headers={["Student", "Course", "Score", "Percentage", "Status"]} rows={attempts.map((a) => [a.student_name, a.course_name, a.score == null ? "—" : `${a.score}/${a.max_score}`, a.percentage == null ? "—" : `${a.percentage}%`, a.status])} empty="No test attempts." />}</section>}
      {tab === "leaderboard" && <section className="admin-section">{loading ? <LoadingRows /> : <AdminTable headers={["Rank", "Student", "Course", "Score", "Time"]} rows={leaders.map((r) => [r.rank, r.student_name, r.course, `${r.score}/${r.max_score}`, `${Math.ceil(r.time_used_seconds / 60)} mins`])} empty="No leaderboard entries." />}</section>}
      {tab === "settings" && <section className="admin-section">{loading || !settings ? <LoadingRows /> : <SettingsForm value={settings} setValue={setSettings} saving={saving} onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { setSettings(await api.updateSettings(token, settings)); setNotice("Settings updated successfully."); sessionStorage.removeItem("unilag-cache:bootstrap"); } catch (err) { setNotice(err instanceof Error ? err.message : "Update failed."); } finally { setSaving(false); } }} />}</section>}
    </main>
  </div>;
}

function Overview({ stats, navigate }: { stats?: Stats; navigate: (tab: Tab) => void }) {
  const getMetricValue = (value: number | [string, number][] | undefined) => (typeof value === "number" ? value : 0);
  const cards: Array<[string, string | number]> = [
    ["Registered students", getMetricValue(stats?.total_registered_students)],
    ["Test attempts", getMetricValue(stats?.total_test_attempts)],
    ["Average score", `${getMetricValue(stats?.average_score)}/40`],
    ["Highest score", `${getMetricValue(stats?.highest_score)}/40`],
  ];
  return <><div className="admin-stat-grid">{cards.map(([label, value]) => <article key={label}><div><p>{label}</p><h2>{String(value)}</h2></div></article>)}</div><div className="admin-grid"><div className="card"><h2>Quick actions</h2><div className="quick-actions"><button onClick={() => navigate("questions")}><BookOpen />Add or manage questions<ChevronRight /></button><button onClick={() => navigate("courses")}><GraduationCap />Manage courses<ChevronRight /></button><button onClick={() => navigate("settings")}><SettingsIcon />Update platform settings<ChevronRight /></button></div></div><div className="card"><h2>Platform status</h2>{["API and database", "40-question grading", "Leaderboard"].map((item) => <div className="status-line" key={item}><span><i />{item}</span><strong>Operational</strong></div>)}</div></div></>;
}

function AdminTable({ headers, rows, empty }: { headers: string[]; rows: (string | number)[][]; empty: string }) {
  if (!rows.length) return <Empty text={empty} />;
  return <div className="table-card"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function QuestionForm({ value, setValue, onSubmit, onClose, saving }: { value: Omit<AdminQuestion, "id">; setValue: (v: Omit<AdminQuestion, "id">) => void; onSubmit: (e: FormEvent) => void; onClose: () => void; saving: boolean }) {
  return <form className="card admin-editor" onSubmit={onSubmit}><div className="editor-head"><h2>Question details</h2><button type="button" onClick={onClose}><X /></button></div><div className="field-row"><label className="field"><span>Subject</span><input required value={value.subject} onChange={(e) => setValue({ ...value, subject: e.target.value })} /></label><label className="field"><span>Topic</span><input value={value.topic || ""} onChange={(e) => setValue({ ...value, topic: e.target.value })} /></label></div><label className="field"><span>Question</span><textarea required value={value.question} onChange={(e) => setValue({ ...value, question: e.target.value })} /></label><div className="field-row">{(["a", "b", "c", "d"] as const).map((letter) => <label className="field" key={letter}><span>Option {letter.toUpperCase()}</span><input required value={value[`option_${letter}`]} onChange={(e) => setValue({ ...value, [`option_${letter}`]: e.target.value })} /></label>)}</div><div className="field-row"><label className="field"><span>Correct answer</span><select value={value.correct_answer} onChange={(e) => setValue({ ...value, correct_answer: e.target.value as "A" | "B" | "C" | "D" })}>{["A", "B", "C", "D"].map((a) => <option key={a}>{a}</option>)}</select></label><label className="field"><span>Difficulty</span><select value={value.difficulty} onChange={(e) => setValue({ ...value, difficulty: e.target.value })}><option>easy</option><option>medium</option><option>hard</option></select></label></div><label className="field"><span>Explanation</span><textarea value={value.explanation || ""} onChange={(e) => setValue({ ...value, explanation: e.target.value })} /></label><button className="button" disabled={saving}>{saving ? <LoaderCircle className="spinner" /> : <Save />}{saving ? "Saving..." : "Save question"}</button></form>;
}

function CourseForm({ value, setValue, onSubmit, onClose, saving }: { value: Course; setValue: (v: Course) => void; onSubmit: (e: FormEvent) => void; onClose: () => void; saving: boolean }) {
  return <form className="card admin-editor" onSubmit={onSubmit}><div className="editor-head"><h2>Course details</h2><button type="button" onClick={onClose}><X /></button></div><div className="field-row"><label className="field"><span>Course name</span><input required value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></label><label className="field"><span>Faculty</span><input required value={value.faculty} onChange={(e) => setValue({ ...value, faculty: e.target.value })} /></label></div><label className="field"><span>UTME subjects (comma-separated)</span><input required value={value.utme_subjects.join(", ")} onChange={(e) => setValue({ ...value, utme_subjects: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} /></label><label className="check-field"><input type="checkbox" checked={value.is_active !== false} onChange={(e) => setValue({ ...value, is_active: e.target.checked })} />Active course</label><button className="button" disabled={saving}>{saving ? <LoaderCircle className="spinner" /> : <Save />}{saving ? "Saving..." : "Save course"}</button></form>;
}

function SettingsForm({ value, setValue, onSubmit, saving }: { value: Settings; setValue: (v: Settings) => void; onSubmit: (e: FormEvent) => void; saving: boolean }) {
  const localDate = value.exam_date?.slice(0, 16);
  return <form className="card settings-form" onSubmit={onSubmit}><h2>Test and community settings</h2><div className="field-row"><label className="field"><span>Exam date and time</span><input type="datetime-local" value={localDate} onChange={(e) => setValue({ ...value, exam_date: new Date(e.target.value).toISOString() })} /></label><label className="field"><span>WhatsApp group link</span><input value={value.whatsapp_group_link} onChange={(e) => setValue({ ...value, whatsapp_group_link: e.target.value })} /></label></div><div className="field-row"><label className="field"><span>Total questions</span><input type="number" min="1" max="100" value={value.total_questions} onChange={(e) => setValue({ ...value, total_questions: Number(e.target.value) })} /></label><label className="field"><span>Maximum score</span><input type="number" min="1" max="100" value={value.max_score} onChange={(e) => setValue({ ...value, max_score: Number(e.target.value) })} /></label></div><label className="field"><span>Durations in minutes (comma-separated)</span><input value={value.available_durations.join(", ")} onChange={(e) => setValue({ ...value, available_durations: e.target.value.split(",").map(Number).filter(Boolean) })} /></label><button className="button" disabled={saving}>{saving ? <LoaderCircle className="spinner" /> : <Save />}{saving ? "Saving..." : "Save settings"}</button></form>;
}
