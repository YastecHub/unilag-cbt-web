import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Award, BarChart3, BookOpen, Check, ChevronRight, Clock3,
  GraduationCap, LayoutDashboard, Menu, MessageCircle, Medal, Settings as SettingsIcon,
  LoaderCircle, ShieldCheck, Target, Timer, Trophy, Users, X,
} from "lucide-react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { api } from "./api";
import { fallbackCourses } from "./courseData";
import type { Course, LeaderboardRow, Result, Settings, Student, TestSession } from "./types";

type State = {
  settings?: Settings; courses: Course[]; student?: Student; course?: Course;
  duration: number; session?: TestSession;
  saveStudent: (student: Student, course: Course) => void;
  setDuration: (duration: number) => void; setSession: (session: TestSession) => void;
};
const Portal = createContext<State | null>(null);
const usePortal = () => useContext(Portal)!;

function PortalProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>();
  const [courses, setCourses] = useState<Course[]>(fallbackCourses);
  const [student, setStudent] = useState<Student | undefined>(() => JSON.parse(localStorage.getItem("unilag-student") || "null"));
  const [course, setCourse] = useState<Course>();
  const [duration, setDuration] = useState(30);
  const [session, setSession] = useState<TestSession>();
  useEffect(() => {
    api.bootstrap()
      .then(({ settings: config, courses: list }) => {
        setSettings(config);
        const available = list.length ? list : fallbackCourses;
        setCourses(available);
        if (student) setCourse(available.find((item) => item.id === student.course_id));
      })
      .catch((error) => {
        console.error(error);
        if (student) setCourse(fallbackCourses.find((item) => item.id === student.course_id));
      });
  }, []);
  const saveStudent = (next: Student, selected: Course) => {
    setStudent(next); setCourse(selected);
    localStorage.setItem("unilag-student", JSON.stringify(next));
  };
  return <Portal.Provider value={{ settings, courses, student, course, duration, session, saveStudent, setDuration, setSession }}>{children}</Portal.Provider>;
}

function Brand() {
  return <Link to="/" className="brand"><span className="brand-mark"><GraduationCap /></span><span>UNILAG<b>PREP</b></span></Link>;
}

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="container nav-wrap"><Brand />
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
    <nav className={open ? "nav-links open" : "nav-links"}>
      <Link to="/">Home</Link><Link to="/leaderboard">Leaderboard</Link><Link to="/admin">Admin</Link>
      <Link className="button small" to="/register">Start free test</Link>
    </nav>
  </div></header>;
}

function Layout({ children, minimal = false }: { children: ReactNode; minimal?: boolean }) {
  return <>{!minimal && <Header />}<main>{children}</main>{!minimal && <footer><div className="container footer-inner"><Brand /><p>Helping UNILAG aspirants prepare with confidence.</p></div></footer>}</>;
}

function Countdown({ compact = false }: { compact?: boolean }) {
  const { settings } = usePortal();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const fallback = "2026-07-27T09:00:00+01:00";
  const left = Math.max(0, new Date(settings?.exam_date || fallback).getTime() - now);
  const units: [string, number][] = [
    ["Days", Math.floor(left / 86400000)], ["Hours", Math.floor(left / 3600000) % 24],
    ["Minutes", Math.floor(left / 60000) % 60], ["Seconds", Math.floor(left / 1000) % 60],
  ];
  return <div className={`countdown ${compact ? "compact" : ""}`}>{units.map(([label, value]) =>
    <div className="count-cell" key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}</div>;
}

function WhatsApp({ label = "Join WhatsApp group" }: { label?: string }) {
  const groupLink = "https://chat.whatsapp.com/HE6ygkLwwne9oamCED0Q7D?s=sh&p=a&ilr=1";
  return <a className="button whatsapp" href={groupLink} target="_blank" rel="noreferrer"><MessageCircle />{label}</a>;
}

function ButtonLabel({ loading, idle, busy }: { loading: boolean; idle: string; busy: string }) {
  return <>{loading && <LoaderCircle className="spinner" />}{loading ? busy : idle}{!loading && <ArrowRight />}</>;
}

function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return <div className="skeleton-page" aria-label="Loading content">
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-copy" />
    <div className="skeleton-card">
      {Array.from({ length: rows }, (_, index) => <div className="skeleton skeleton-row" key={index} />)}
    </div>
  </div>;
}

function Home() {
  const features = [
    [Timer, "Timed CBT practice", "Practise under real exam pressure with flexible timing."],
    [Target, "Course-based subjects", "Your correct subjects are generated automatically."],
    [BarChart3, "Instant breakdown", "See your score and strongest subjects immediately."],
    [Trophy, "Live leaderboard", "Compare your performance with other aspirants."],
  ] as const;
  return <Layout>
    <section className="hero"><div className="container hero-grid">
      <div><div className="hero-badge"><Check />Free for UNILAG aspirants</div>
        <h1>Prepare smarter.<br /><em>Score higher.</em><br />Get into UNILAG.</h1>
        <p className="lead">Take free timed CBT practice tests, see your result instantly, compare your rank, and improve with serious aspirants.</p>
        <div className="actions"><Link className="button" to="/register">Start free test <ArrowRight /></Link><WhatsApp /></div>
        <div className="trust"><span><Check />No payment</span><span><Check />Instant results</span><span><Check />40 questions</span></div>
      </div>
      <div className="hero-panel"><div className="panel-top"><span><i /> Exam countdown</span><b>July 27, 2026</b></div><Countdown />
        <div className="mock-score"><div className="score-ring"><strong>32</strong><span>/40</span></div><div><small>Your latest score</small><h3>Excellent work!</h3><p>You are in the top 8% of aspirants.</p></div></div>
        <div className="rank-strip"><Trophy /><span>Current rank</span><strong>#7</strong><small>of 450</small></div>
      </div>
    </div></section>
    <section className="section"><div className="container"><div className="section-heading"><span>Everything you need</span><h2>Practice like the real exam</h2><p>A focused CBT experience built around the UNILAG Post-UTME format.</p></div>
      <div className="feature-grid">{features.map(([Icon, title, text]) => <article className="feature-card" key={title}><span className="icon-box"><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </div></section>
    <section className="cta-section"><div className="container cta-card"><div><span className="cta-label">Free practice. No subscription.</span><h2>Ready to test your preparation?</h2><p>Join other aspirants practising before July 27.</p></div><Link className="button light" to="/register">Take a free test <ChevronRight /></Link></div></section>
  </Layout>;
}

function Register() {
  const { courses, saveStudent } = usePortal();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", utme_score: "", course_id: "", email: "", whatsapp_number: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const body: Record<string, unknown> = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value || undefined]));
      body.utme_score = Number(form.utme_score);
      const created = await api.register(body);
      saveStudent(created, courses.find((item) => item.id === form.course_id)!);
      navigate("/setup");
    } catch (err) { setError(err instanceof Error ? err.message : "Registration failed"); } finally { setLoading(false); }
  };
  return <Layout><section className="page"><div className="container form-layout">
    <div className="form-side"><span className="step-label">Step 1 of 3</span><h1>Tell us about yourself</h1><p>We use this to personalise your test and leaderboard rank.</p>
      <div className="side-note"><ShieldCheck /><div><strong>Your details are safe</strong><span>We only collect what your practice experience needs.</span></div></div><Countdown compact /></div>
    <form className="card form-card" onSubmit={submit}>
      <Field label="Full name *"><input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="e.g. Yasir Oladimeji" /></Field>
      <div className="field-row"><Field label="UTME score *"><input required type="number" min="0" max="400" value={form.utme_score} onChange={(e) => update("utme_score", e.target.value)} placeholder="0 - 400" /></Field><Field label="Email address"><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@email.com" /></Field></div>
      <Field label="Intended UNILAG course *"><select required value={form.course_id} onChange={(e) => update("course_id", e.target.value)}><option value="">Select your course</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      <Field label="WhatsApp number"><input type="tel" inputMode="tel" value={form.whatsapp_number} onChange={(e) => update("whatsapp_number", e.target.value)} placeholder="e.g. 090688913009" /></Field>
      {error && <p className="error">{error}</p>}<button className="button full" disabled={loading}><ButtonLabel loading={loading} idle="Continue to test setup" busy="Saving your details..." /></button>
    </form>
  </div></section></Layout>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }

function Setup() {
  const { student, course, settings, duration, setDuration } = usePortal();
  if (!student || !course) return <Navigate to="/register" />;
  return <Layout><section className="page"><div className="container narrow">
    <div className="page-top"><div><span className="step-label">Step 2 of 3</span><h1>Set up your practice test</h1><p>We generated the correct subjects for {course.name}.</p></div><Countdown compact /></div>
    <div className="setup-grid"><div className="card"><div className="profile-line"><div className="avatar">{student.full_name[0]}</div><div><strong>{student.full_name}</strong><span>{course.name} · UTME {student.utme_score}</span></div></div><h3>Your test subjects</h3>
      <div className="subject-list">{course.final_test_subjects.map((subject, index) => <div key={subject}><span>{index + 1}</span>{subject}<Check /></div>)}</div></div>
      <div className="card"><h3>Test details</h3><div className="stats-row"><div><strong>{settings?.total_questions || 40}</strong><span>Questions</span></div><div><strong>{settings?.max_score || 40}</strong><span>Total marks</span></div><div><strong>1</strong><span>Mark each</span></div></div>
        <h3>Choose test duration</h3><div className="duration-grid">{(settings?.available_durations || [10,15,20,30,45,60]).map((item) => <button className={duration === item ? "duration active" : "duration"} onClick={() => setDuration(item)} key={item}><Clock3 />{item} mins</button>)}</div>
        <Link className="button full" to="/instructions">Continue to instructions <ArrowRight /></Link><div className="whatsapp-note"><MessageCircle />Daily questions are waiting in our free study group.</div>
      </div>
    </div>
  </div></section></Layout>;
}

function Instructions() {
  const { student, course, duration, setSession } = usePortal();
  const navigate = useNavigate(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  if (!student || !course) return <Navigate to="/register" />;
  const rules = [`This is a ${duration}-minute timed CBT practice test.`, "Your test has 40 questions and is graded over 40 marks.", "English, Mathematics, and General Paper each have 10 questions.", "Your course combination contributes 10 questions distributed as 3, 3, and 4.", "Each question carries exactly 1 mark.", "You can move between questions before submitting.", "The test submits automatically when the timer reaches zero.", "Unanswered questions are marked wrong.", "Your result and rank appear immediately."];
  const start = async () => { setLoading(true); try { const test = await api.startTest(student.id, duration); setSession(test); localStorage.setItem("unilag-session", JSON.stringify(test)); navigate(`/test/${test.attempt.id}`); } catch (err) { setError(err instanceof Error ? err.message : "Could not start test"); setLoading(false); } };
  return <Layout><section className="page"><div className="container instruction-wrap"><div className="instruction-heading"><span className="icon-box large"><BookOpen /></span><span className="step-label">Step 3 of 3</span><h1>Test instructions</h1><p>Read carefully. Your timer starts immediately.</p></div>
    <div className="card instruction-card">{rules.map((rule, index) => <div className="rule" key={rule}><span>{index + 1}</span><p>{rule}</p></div>)}</div>
    <div className="ready-card"><div><strong>Ready, {student.full_name.split(" ")[0]}?</strong><span>{course.name} - 40 questions - {duration} minutes</span></div><button className="button" onClick={start} disabled={loading}><ButtonLabel loading={loading} idle="Start test now" busy="Loading questions..." /></button></div>{error && <p className="error">{error}</p>}
  </div></section></Layout>;
}

function Test() {
  const { attemptId } = useParams(); const navigate = useNavigate(); const { session: current } = usePortal();
  const session = current || JSON.parse(localStorage.getItem("unilag-session") || "null") as TestSession | null;
  const [index, setIndex] = useState(0); const [answers, setAnswers] = useState<Record<string,string>>({});
  const [seconds, setSeconds] = useState(session ? session.attempt.duration_selected_minutes * 60 : 0);
  const [confirm, setConfirm] = useState(false); const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!session || submitting) return; setSubmitting(true);
    try { const total = session.attempt.duration_selected_minutes * 60; await api.submitTest(session.attempt.id, answers, total - seconds); navigate(`/result/${session.attempt.id}`); }
    catch { setSubmitting(false); }
  };
  useEffect(() => { if (!session) return; const id = setInterval(() => setSeconds((value) => { if (value <= 1) { clearInterval(id); setTimeout(() => void submit(), 0); return 0; } return value - 1; }), 1000); return () => clearInterval(id); }, [session, answers]);
  if (!session || attemptId !== session.attempt.id) return <Navigate to="/setup" />;
  const question = session.questions[index]; const answered = Object.keys(answers).length; const totalQuestions = session.questions.length;
  return <Layout minimal><div className="test-shell"><header className="test-header"><Brand /><div className={`test-timer ${seconds < 60 ? "danger" : ""}`}><Timer /><span>Time left</span><strong>{String(Math.floor(seconds / 60)).padStart(2,"0")}:{String(seconds % 60).padStart(2,"0")}</strong></div><button className="button outline" onClick={() => setConfirm(true)}>Submit test</button></header><div className="test-progress"><span style={{ width: `${((index + 1) / totalQuestions) * 100}%` }} /></div>
    <main className="test-main"><section className="question-area"><div className="question-meta"><span>{question.subject}</span><strong>Question {index + 1} of {totalQuestions}</strong></div><h2>{question.question}</h2>
      <div className="options">{(["A","B","C","D"] as const).map((letter) => <button className={`option ${answers[question.id] === letter ? "selected" : ""}`} key={letter} onClick={() => setAnswers({...answers,[question.id]:letter})}><span>{letter}</span><p>{question[`option_${letter.toLowerCase()}` as keyof typeof question]}</p>{answers[question.id] === letter && <Check />}</button>)}</div>
      <div className="question-actions"><button className="button muted" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft />Previous</button><button className="button" disabled={index === totalQuestions - 1} onClick={() => setIndex(index + 1)}>Next<ArrowRight /></button></div>
    </section><aside className="palette"><div className="palette-head"><h3>Question palette</h3><span>{answered}/{totalQuestions} answered</span></div><div className="palette-grid">{session.questions.map((item, i) => <button className={`${answers[item.id] ? "answered" : ""} ${i === index ? "current" : ""}`} onClick={() => setIndex(i)} key={item.id}>{i + 1}</button>)}</div><div className="legend"><span><i className="answered" />Answered</span><span><i />Not answered</span></div></aside></main>
  </div>{confirm && <div className="modal-backdrop"><div className="modal"><span className="icon-box warning"><ShieldCheck /></span><h2>Submit your test?</h2><p>You answered <strong>{answered} out of {totalQuestions}</strong>. Unanswered questions will be marked wrong.</p><div className="modal-actions"><button className="button muted" onClick={() => setConfirm(false)} disabled={submitting}>Keep answering</button><button className="button" onClick={submit} disabled={submitting}>{submitting && <LoaderCircle className="spinner" />}{submitting ? "Marking answers..." : "Submit test"}</button></div></div></div>}</Layout>;
}

function ResultPage() {
  const { attemptId } = useParams(); const [result, setResult] = useState<Result>(); const [error, setError] = useState("");
  useEffect(() => { if (attemptId) api.result(attemptId).then(setResult).catch((err) => setError(err.message)); }, [attemptId]);
  if (error) return <Layout><div className="empty-state"><h2>Result unavailable</h2><p>{error}</p><Link className="button" to="/setup">Start another test</Link></div></Layout>;
  if (!result) return <Layout><div className="container"><PageSkeleton rows={6} /></div></Layout>;
  return <Layout><section className="result-hero"><div className="container"><span className="icon-box success"><Award /></span><p>Test completed</p><h1>Well done, {result.student.full_name.split(" ")[0]}!</h1><span>{result.recommendation}</span></div></section>
    <section className="result-body"><div className="container result-grid"><div className="score-card"><div className="score-circle"><strong>{result.score}</strong><span>/ {result.max_score}</span></div><h2>{result.percentage}%</h2><p>Final score</p><div className="result-mini"><div><strong>{result.correct_answers}</strong><span>Correct</span></div><div><strong>{result.wrong_answers}</strong><span>Wrong</span></div><div><strong>{result.unanswered_questions}</strong><span>Unanswered</span></div></div></div>
      <div className="card rank-card"><div className="rank-icon"><Medal /></div><div><span>Leaderboard rank</span><h2>#{result.leaderboard_rank || "-"}</h2><p>out of {result.total_aspirants} attempts</p></div><Link to="/leaderboard">View leaderboard <ArrowRight /></Link></div>
      <div className="card breakdown"><h2>Subject breakdown</h2>{Object.entries(result.subject_breakdown).map(([subject, score]) => <div className="breakdown-row" key={subject}><div><span>{subject}</span><strong>{score.correct}/{score.total}</strong></div><div className="bar"><span style={{width:`${score.correct / score.total * 100}%`}} /></div></div>)}</div>
      <div className="card details"><h2>Test details</h2><dl><div><dt>Course</dt><dd>{result.course.name}</dd></div><div><dt>UTME score</dt><dd>{result.student.utme_score}</dd></div><div><dt>Duration</dt><dd>{result.duration_selected_minutes} mins</dd></div><div><dt>Time used</dt><dd>{Math.ceil(result.time_used_seconds / 60)} mins</dd></div></dl><Link className="button full" to="/setup">Take another test <ArrowRight /></Link></div>
      <div className="whatsapp-card"><MessageCircle /><div><h2>Improve before July 27</h2><p>Get daily questions and explanations with other aspirants.</p></div><WhatsApp label="Join free study group" /></div>
    </div></section>
  </Layout>;
}

function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]); const [period, setPeriod] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api.leaderboard(period ? `?period=${period}` : "").then(setRows).catch(console.error).finally(() => setLoading(false));
  }, [period]);
  return <Layout><section className="leaderboard-hero"><div className="container"><span className="icon-box gold"><Trophy /></span><h1>Aspirant leaderboard</h1><p>See how you rank among students preparing for UNILAG.</p></div></section>
    <section className="leaderboard-section"><div className="container"><div className="filter-tabs">{[["","Overall"],["today","Today"],["weekly","This week"],["monthly","This month"]].map(([value,label]) => <button className={period === value ? "active" : ""} onClick={() => setPeriod(value)} key={value}>{label}</button>)}</div>
      {loading ? <div className="table-card table-skeleton">{Array.from({ length: 6 }, (_, index) => <div className="skeleton skeleton-table-row" key={index} />)}</div> : <div className="table-card"><table><thead><tr><th>Rank</th><th>Aspirant</th><th>Course</th><th>Score</th><th>Percentage</th><th>Time used</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.attempt_id}><td><span className={`rank-number rank-${row.rank}`}>{row.rank}</span></td><td><strong>{row.student_name}</strong></td><td>{row.course}</td><td><strong>{row.score}/{row.max_score}</strong></td><td>{row.percentage}%</td><td>{Math.ceil(row.time_used_seconds / 60)} mins</td></tr>) : <tr><td colSpan={6} className="empty-row">No attempts yet. Be the first on the board.</td></tr>}</tbody></table></div>}
      <div className="leaderboard-cta"><div><h2>Think you can reach the top?</h2><p>Take another test and improve your rank.</p></div><Link className="button" to="/register">Start free test <ArrowRight /></Link><WhatsApp /></div>
    </div></section>
  </Layout>;
}

function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem("admin-token") || ""); const [stats, setStats] = useState<Record<string, number | [string,number][]>>();
  const [credentials, setCredentials] = useState({ email: "admin@unilagcbt.local", password: "" }); const [error, setError] = useState("");
  const login = async (event: FormEvent) => { event.preventDefault(); try { const data = await api.adminLogin(credentials.email, credentials.password); setToken(data.access_token); sessionStorage.setItem("admin-token",data.access_token); } catch (err) { setError(err instanceof Error ? err.message : "Login failed"); } };
  useEffect(() => { if (token) api.adminDashboard(token).then(setStats).catch(() => setToken("")); }, [token]);
  if (!token) return <Layout><section className="admin-login"><form className="card admin-login-card" onSubmit={login}><span className="icon-box"><ShieldCheck /></span><h1>Admin login</h1><p>Manage questions, courses, settings, and results.</p><Field label="Email"><input type="email" value={credentials.email} onChange={(e) => setCredentials({...credentials,email:e.target.value})} /></Field><Field label="Password"><input required type="password" value={credentials.password} onChange={(e) => setCredentials({...credentials,password:e.target.value})} /></Field>{error && <p className="error">{error}</p>}<button className="button full">Sign in securely</button></form></section></Layout>;
  const cards = [[Users,"Registered students",stats?.total_registered_students || 0],[BookOpen,"Test attempts",stats?.total_test_attempts || 0],[Target,"Average score",`${stats?.average_score || 0}/40`],[Trophy,"Highest score",`${stats?.highest_score || 0}/40`]] as const;
  return <Layout minimal><div className="admin-shell"><aside className="admin-sidebar"><Brand /><nav><a className="active"><LayoutDashboard />Overview</a><a><BookOpen />Questions</a><a><GraduationCap />Courses</a><a><Users />Students</a><a><Trophy />Leaderboard</a><a><SettingsIcon />Settings</a></nav><button onClick={() => { sessionStorage.removeItem("admin-token"); setToken(""); }}>Sign out</button></aside>
    <main className="admin-main"><div className="admin-top"><div><p>Admin workspace</p><h1>Dashboard overview</h1></div><Link className="button outline" to="/">View portal</Link></div><div className="admin-stat-grid">{cards.map(([Icon,label,value]) => <article key={label}><span className="icon-box"><Icon /></span><div><p>{label}</p><h2>{String(value)}</h2></div></article>)}</div>
      <div className="admin-grid"><div className="card"><h2>Quick actions</h2><div className="quick-actions"><button><BookOpen />Add a question<ChevronRight /></button><button><GraduationCap />Manage courses<ChevronRight /></button><button><SettingsIcon />Update exam settings<ChevronRight /></button></div></div><div className="card"><h2>Platform status</h2>{["API and database","40-question grading","Leaderboard"].map((item) => <div className="status-line" key={item}><span><i />{item}</span><strong>Operational</strong></div>)}</div></div>
    </main>
  </div></Layout>;
}

export default function App() {
  return <PortalProvider><Routes><Route path="/" element={<Home />} /><Route path="/register" element={<Register />} /><Route path="/setup" element={<Setup />} /><Route path="/instructions" element={<Instructions />} /><Route path="/test/:attemptId" element={<Test />} /><Route path="/result/:attemptId" element={<ResultPage />} /><Route path="/leaderboard" element={<Leaderboard />} /><Route path="/admin" element={<Admin />} /><Route path="*" element={<Navigate to="/" />} /></Routes></PortalProvider>;
}
