import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import AuthScreen from './AuthScreen.jsx';

const API = 'http://localhost:5000/api/assignments';
const AUTH_API = 'http://localhost:5000/api/auth';
const SESSION_KEY = 'coursemate-session';
const emptyForm = { title: '', subject: '', description: '', dueDate: '', priority: 'Medium' };
const todayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date';
const dueLabel = (value) => {
  if (!value) return 'No deadline';
  const due = new Date(value);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(due, today)) return 'Due today';
  if (sameDay(due, tomorrow)) return 'Due tomorrow';
  return `Due ${dateLabel(value)}`;
};
const toLocalInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const Icon = ({ children, size = 18 }) => <span className="icon" style={{ '--icon-size': `${size}px` }} aria-hidden="true">{children}</span>;

function App() {
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All tasks');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [sort, setSort] = useState('Deadline');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [token, setToken] = useState('');
  const [student, setStudent] = useState(null);
  const [savedSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { localStorage.removeItem(SESSION_KEY); return null; }
  });
  const [checkingSession, setCheckingSession] = useState(Boolean(savedSession?.token));

  const loadAssignments = useCallback(async () => {
    try {
      const response = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) {
        localStorage.removeItem(SESSION_KEY);
        setToken('');
        setStudent(null);
        setAssignments([]);
        return;
      }
      if (!response.ok) throw new Error('Could not load assignments. Check that the server is running.');
      setAssignments(await response.json());
      setError('');
    } catch (err) { setError(err.message || 'Cannot connect to the backend.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!savedSession?.token) return;
    fetch(`${AUTH_API}/me`, { headers: { Authorization: `Bearer ${savedSession.token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired.');
        const data = await response.json();
        setToken(savedSession.token);
        setStudent(data.student);
      })
      .catch(() => localStorage.removeItem(SESSION_KEY))
      .finally(() => setCheckingSession(false));
  }, [savedSession]);

  useEffect(() => {
    if (!student || !token) return undefined;
    const request = window.setTimeout(() => { void loadAssignments(); }, 0);
    return () => window.clearTimeout(request);
  }, [student, token, loadAssignments]);

  function handleAuthenticated(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: session.token }));
    setLoading(true);
    setToken(session.token);
    setStudent(session.student);
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    setToken('');
    setStudent(null);
    setAssignments([]);
    resetForm();
  }

  const completed = assignments.filter((item) => item.status === 'Completed').length;
  const pending = assignments.length - completed;
  const now = useMemo(() => new Date(), []);
  const overdue = assignments.filter((item) => item.status !== 'Completed' && item.dueDate && new Date(item.dueDate) < now).length;
  const dueSoon = assignments.filter((item) => {
    const delta = new Date(item.dueDate) - now;
    return item.status !== 'Completed' && item.dueDate && delta >= 0 && delta <= 7 * 86400000;
  }).length;
  const completionRate = assignments.length ? Math.round(completed / assignments.length * 100) : 0;
  const upcoming = [...assignments].filter((item) => item.status !== 'Completed' && item.dueDate && new Date(item.dueDate) >= now).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assignments.filter((item) => {
      const matchesSearch = [item.title, item.subject, item.description].some((value) => (value || '').toLowerCase().includes(query));
      const status = item.status || 'Pending';
      const matchesFilter = filter === 'All tasks' || (filter === 'To do' && status !== 'Completed') || (filter === 'Completed' && status === 'Completed') || (filter === 'Overdue' && status !== 'Completed' && item.dueDate && new Date(item.dueDate) < now);
      const matchesPriority = priorityFilter === 'All priorities' || (item.priority || 'Medium') === priorityFilter;
      return matchesSearch && matchesFilter && matchesPriority;
    }).sort((a, b) => sort === 'Priority' ? ({ High: 0, Medium: 1, Low: 2 }[a.priority || 'Medium'] - { High: 0, Medium: 1, Low: 2 }[b.priority || 'Medium']) : sort === 'Recently added' ? new Date(b.createdAt || b.dueDate) - new Date(a.createdAt || a.dueDate) : new Date(a.dueDate || '2999-01-01') - new Date(b.dueDate || '2999-01-01'));
  }, [assignments, search, filter, priorityFilter, sort, now]);

  if (checkingSession) {
    return <main className="session-loading"><span className="loading-spinner" /><p>Opening your CourseMate space…</p></main>;
  }
  if (!student || !token) return <AuthScreen onAuthenticated={handleAuthenticated} />;

  function resetForm() { setForm(emptyForm); setEditingId(null); setShowForm(false); }
  function openForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    window.setTimeout(() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!form.title.trim() || !form.subject.trim() || !form.dueDate) { setError('Add a title, subject and due date to continue.'); return; }
    try {
      setSaving(true);
      const isEditing = editingId !== null;
      const response = await fetch(isEditing ? `${API}/${editingId}` : API, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...form, dueDate: new Date(form.dueDate).toISOString() }) });
      if (!response.ok) throw new Error((await response.text()) || 'Could not save assignment.');
      resetForm(); setSuccess(isEditing ? 'Assignment updated.' : 'Assignment added to your planner.'); await loadAssignments();
    } catch (err) { setError(err.message || 'Something went wrong.'); }
    finally { setSaving(false); }
  }
  function startEditing(item) {
    setEditingId(item._id); setForm({ title: item.title || '', subject: item.subject || '', description: item.description || '', dueDate: toLocalInputValue(item.dueDate), priority: item.priority || 'Medium' }); setShowForm(true); setError(''); setSuccess('');
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function updateStatus(item) {
    try {
      const response = await fetch(`${API}/${item._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: item.status === 'Completed' ? 'Pending' : 'Completed' }) });
      if (!response.ok) throw new Error('Could not update assignment status.');
      setSuccess(item.status === 'Completed' ? 'Assignment moved back to your to-do list.' : 'Nice work — assignment completed!'); await loadAssignments();
    } catch (err) { setError(err.message); }
  }
  async function deleteAssignment(id) {
    if (!window.confirm('Delete this assignment? This cannot be undone.')) return;
    try { const response = await fetch(`${API}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error('Could not delete assignment.'); if (editingId === id) resetForm(); setSuccess('Assignment deleted.'); await loadAssignments(); }
    catch (err) { setError(err.message); }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#dashboard" onClick={() => setMobileNav(false)}><span className="brand-mark"><Icon size={20}>✳</Icon></span><span>course<span className="brand-accent">mate</span></span></a>
      <div className="workspace-label">STUDENT WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        <a className="nav-link active" href="#dashboard" onClick={() => setMobileNav(false)}><Icon>▦</Icon> Overview</a>
        <a className="nav-link" href="#planner" onClick={(event) => { event.preventDefault(); setMobileNav(false); openForm(); }}><Icon>＋</Icon> Add assignment</a>
        <a className="nav-link" href="#my-work" onClick={() => setMobileNav(false)}><Icon>◷</Icon> My coursework <span className="nav-count">{pending}</span></a>
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-tip"><span className="tip-spark">✦</span><p className="tip-title">Small steps add up.</p><p>Plan a little today and make deadline week feel lighter.</p></div>
      <div className="profile"><div className="avatar">{student.name.slice(0, 1).toUpperCase()}</div><div><strong>{student.name}</strong><span>{student.email}</span></div><button className="profile-menu" onClick={signOut} title="Sign out" aria-label="Sign out">Sign out</button></div>
    </aside>

    <main className="main-content" id="dashboard">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">☰</button><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="top-actions"><div className="today-label"><span className="live-dot" /> Your semester, in sync</div><button className="avatar small-avatar" aria-label={`${student.name} profile`}>{student.name.slice(0, 1).toUpperCase()}</button></div></header>
      <div className="page-wrap">
        {(error || success) && <div className={`toast ${error ? 'toast-error' : 'toast-success'}`} role={error ? 'alert' : 'status'}><span>{error ? '!' : '✓'}</span><p>{error || success}</p><button onClick={() => { setError(''); setSuccess(''); }} aria-label="Dismiss">×</button></div>}
        <section className="welcome-row"><div><p className="overline">{todayLabel}</p><h1>Make room for <span>great work.</span></h1><p className="welcome-copy">A little clarity goes a long way. Here’s your coursework at a glance.</p></div><button className="button button-primary" onClick={openForm}><Icon>＋</Icon> New assignment</button></section>

        <section className="stats-grid" aria-label="Assignment summary">
          <article className="stat-card"><div className="stat-head"><span className="stat-label">Open tasks</span><span className="stat-icon purple"><Icon>◷</Icon></span></div><strong className="stat-number">{loading ? '—' : pending}</strong><div className="stat-foot"><span className="stat-dot purple-dot" /> {dueSoon} due in the next 7 days</div></article>
          <article className="stat-card"><div className="stat-head"><span className="stat-label">Completed</span><span className="stat-icon green"><Icon>✓</Icon></span></div><strong className="stat-number">{loading ? '—' : completed}</strong><div className="stat-foot"><span className="stat-dot green-dot" /> {completionRate}% of your coursework</div></article>
          <article className="stat-card"><div className="stat-head"><span className="stat-label">Overdue</span><span className="stat-icon coral"><Icon>!</Icon></span></div><strong className="stat-number">{loading ? '—' : overdue}</strong><div className="stat-foot"><span className="stat-dot coral-dot" /> {overdue ? 'Needs your attention' : 'You’re all caught up'}</div></article>
          <article className="stat-card"><div className="stat-head"><span className="stat-label">All assignments</span><span className="stat-icon blue"><Icon>▤</Icon></span></div><strong className="stat-number">{loading ? '—' : assignments.length}</strong><div className="stat-foot"><span className="stat-dot blue-dot" /> Across your subjects</div></article>
        </section>

        <section className="overview-grid">
          <article className="panel progress-panel"><div className="panel-heading"><div><p className="overline">YOUR MOMENTUM</p><h2>Progress overview</h2></div><span className="period-pill">All time <span>⌄</span></span></div><div className="progress-layout"><div className="progress-ring" style={{ '--progress': `${completionRate * 3.6}deg` }}><div className="ring-inner"><strong>{completionRate}<small>%</small></strong><span>complete</span></div></div><div className="progress-details"><p>{assignments.length ? completionRate >= 70 ? 'You’re building a great rhythm.' : 'Every finished task moves you forward.' : 'Your progress starts with one task.'}</p><div className="legend-row"><span><i className="legend-dot done-dot" />Completed</span><b>{completed}</b></div><div className="legend-row"><span><i className="legend-dot todo-dot" />To do</span><b>{pending}</b></div></div></div></article>
          <article className="panel upcoming-panel"><div className="panel-heading"><div><p className="overline">KEEP AN EYE ON</p><h2>Coming up</h2></div><a href="#my-work" className="text-link" onClick={() => setFilter('To do')}>View all <span>→</span></a></div>{upcoming.length ? <div className="upcoming-list">{upcoming.map((item, index) => <div className="upcoming-item" key={item._id}><div className={`date-tile date-${index}`}><strong>{new Date(item.dueDate).getDate()}</strong><span>{new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</span></div><div className="upcoming-copy"><strong>{item.title}</strong><span>{item.subject}</span></div><span className={`priority-dot ${(item.priority || 'Medium').toLowerCase()}`} title={`${item.priority || 'Medium'} priority`} /></div>)}</div> : <div className="upcoming-empty"><span>✦</span><p>{loading ? 'Loading deadlines…' : 'No upcoming deadlines. Enjoy the breathing room.'}</p></div>}</article>
        </section>

        {showForm && <section className="panel form-panel" id="planner"><div className="panel-heading"><div><p className="overline">{editingId ? 'MAKE A CHANGE' : 'PLAN AHEAD'}</p><h2>{editingId ? 'Edit assignment' : 'Add an assignment'}</h2></div><button className="icon-button" onClick={resetForm} aria-label="Close form">×</button></div><form className="assignment-form" onSubmit={handleSubmit}><label>Assignment title<input name="title" placeholder="e.g. Research paper — chapter 3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label><label>Subject<input name="subject" placeholder="e.g. Computer Science" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></label><label>Due date<input name="dueDate" type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></label><label>Priority<select name="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label><label className="form-wide">Notes <span className="optional-label">(optional)</span><textarea name="description" placeholder="Add a few details to help future you…" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><div className="form-actions form-wide"><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add to planner'}</button><button className="button button-quiet" type="button" onClick={resetForm}>Cancel</button></div></form></section>}

        <section className="panel tasks-panel" id="my-work"><div className="tasks-heading"><div><p className="overline">YOUR ACADEMIC LOAD</p><h2>My coursework <span className="task-count">{filteredAssignments.length}</span></h2></div><button className="button button-outline" onClick={openForm}><Icon>＋</Icon> Add task</button></div>
          <div className="toolbar"><div className="filter-tabs">{['All tasks', 'To do', 'Completed', 'Overdue'].map((tab) => <button className={filter === tab ? 'filter-tab selected' : 'filter-tab'} key={tab} onClick={() => setFilter(tab)}>{tab}{tab === 'To do' && <span>{pending}</span>}</button>)}</div><div className="list-controls"><label className="search-box"><Icon>⌕</Icon><input type="search" placeholder="Search coursework…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search coursework" />{search && <button onClick={() => setSearch('')} aria-label="Clear search">×</button>}</label><select className="control-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Filter by priority"><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select><select className="control-select sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort assignments"><option>Deadline</option><option>Priority</option><option>Recently added</option></select></div></div>
          <div className="task-list">{loading ? <div className="list-empty"><div className="loading-spinner" /><strong>Loading your coursework</strong><span>Getting everything in order…</span></div> : filteredAssignments.length === 0 ? <div className="list-empty"><div className="empty-mark">{assignments.length ? '⌕' : '✳'}</div><strong>{assignments.length ? 'No coursework found' : 'Your planner is ready'}</strong><span>{assignments.length ? 'Try a different search or filter.' : 'Add your first assignment to get organized.'}</span>{!assignments.length && <button className="button button-primary" onClick={() => setShowForm(true)}>Add your first task</button>}</div> : filteredAssignments.map((item) => { const isDone = item.status === 'Completed'; const isOverdue = !isDone && item.dueDate && new Date(item.dueDate) < now; return <article className={`task-row ${isDone ? 'task-done' : ''}`} key={item._id}><button className={`check-button ${isDone ? 'checked' : ''}`} onClick={() => updateStatus(item)} aria-label={isDone ? `Mark ${item.title} as pending` : `Mark ${item.title} as complete`}>{isDone && '✓'}</button><div className="task-main"><div className="task-title-line"><h3>{item.title}</h3><span className={`priority-chip ${(item.priority || 'Medium').toLowerCase()}`}>{item.priority || 'Medium'}</span></div><div className="task-meta"><span className="subject-name">{item.subject}</span>{item.description && <><i /> <span className="task-description">{item.description}</span></>}<i /><span className={`task-due ${isOverdue ? 'is-overdue' : ''}`}><Icon size={14}>{isOverdue ? '!' : '◷'}</Icon> {isOverdue ? `Overdue · ${dateLabel(item.dueDate)}` : dueLabel(item.dueDate)}</span></div></div><div className="task-actions"><button onClick={() => startEditing(item)} aria-label={`Edit ${item.title}`} title="Edit">↗</button><button className="delete-action" onClick={() => deleteAssignment(item._id)} aria-label={`Delete ${item.title}`} title="Delete">×</button></div></article>; })}</div>
        </section>
        <footer className="footer"><span>✳ CourseMate</span><span>One thoughtful step at a time.</span><a href="#dashboard">Back to top ↑</a></footer>
      </div>
    </main>
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
  </div>;
}

export default App;
