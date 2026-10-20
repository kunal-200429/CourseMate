import { useEffect, useState } from 'react';
import './App.css';
import './CrazyUI.css';

const API = 'http://localhost:5000/api/assignments';

const emptyForm = {
  title: '',
  subject: '',
  description: '',
  dueDate: '',
  priority: 'Medium',
};

function App() {
  console.log("NEW COURSEMATE APP LOADED");
  
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      setLoading(true);
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error('Could not load assignments');
      }

      const data = await response.json();
      setAssignments(data);
      setError('');
    } catch (err) {
      setError(
        err.message || 'Cannot connect to backend. Check server.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.subject.trim() || !form.dueDate) {
      setError('Please fill in title, subject and due date.');
      return;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;
      const url = isEditing
        ? `${API}/${editingId}`
        : API;

      const payload = {
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
      };

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Could not save assignment');
      }

      resetForm();
      setSuccess(
        isEditing
          ? 'Assignment updated successfully!'
          : 'Assignment added successfully!'
      );

      await loadAssignments();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item) {
    setEditingId(item._id);

    setForm({
      title: item.title || '',
      subject: item.subject || '',
      description: item.description || '',
      dueDate: item.dueDate
        ? new Date(item.dueDate).toISOString().slice(0, 16)
        : '',
      priority: item.priority || 'Medium',
    });

    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function updateStatus(item) {
    setError('');
    setSuccess('');

    const nextStatus =
      item.status === 'Completed' ? 'Pending' : 'Completed';

    try {
      const response = await fetch(`${API}/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error('Could not update assignment status');
      }

      setSuccess('Assignment status updated!');
      await loadAssignments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAssignment(id) {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not delete assignment');
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess('Assignment deleted successfully!');
      await loadAssignments();
    } catch (err) {
      setError(err.message);
    }
  }

  const completed = assignments.filter(
    (item) => item.status === 'Completed'
  ).length;

  const pending = assignments.length - completed;

  const overdue = assignments.filter(
    (item) =>
      item.status !== 'Completed' &&
      item.dueDate &&
      new Date(item.dueDate) < new Date()
  ).length;

  const completionRate = assignments.length
    ? Math.round((completed / assignments.length) * 100)
    : 0;

  const filteredAssignments = assignments.filter((item) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      (item.title || '').toLowerCase().includes(query) ||
      (item.subject || '').toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'All' ||
      (item.status || 'Pending') === statusFilter;

    const matchesPriority =
      priorityFilter === 'All' ||
      (item.priority || 'Medium') === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  function clearFilters() {
    setSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
  }

    return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          Course<span>Mate</span>
        </a>

        <p className="tagline">
          Your coursework, under control.
        </p>

        <div className="sidebar-section-label">WORKSPACE</div>

        
<nav className="nav-links">
  <a href="#dashboard">📊 Dashboard</a>
  <a href="#assignment-form">➕ Assignments</a>
  <a href="#assignment-list">📚 My Work</a>
  <a href="#about">ℹ️ About</a>
</nav>


        <div className="sidebar-bottom">
          <span className="sidebar-section-label">YOUR PROGRESS</span>
          <p>Keep going. Every task counts! 🚀</p>
        </div>
      </header>

      <main className="container" id="dashboard">
        <section className="hero">
          <div>
            <p className="eyebrow">YOUR STUDENT WORKSPACE</p>

            <h1>
              Stay ahead of
              <br />
              every deadline.
            </h1>

            <p className="subtitle">
              Organise assignments, track due dates and make every
              submission count.
            </p>
          </div>

          <div className="hero-icon">🎓</div>
        </section>

        {error && (
          <div className="message error-message" role="alert">
            ⚠️ {error}
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="message success-message" role="status">
            ✅ {success}
            <button
              type="button"
              onClick={() => setSuccess('')}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="stats">
          <div className="stat-card">
            <span>Total assignments</span>
            <strong>{assignments.length}</strong>
            <small>📝 All your coursework</small>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <strong>{pending}</strong>
            <small>⏳ Still to complete</small>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>{completed}</strong>
            <small>✅ Tasks finished</small>
          </div>

          <div className="stat-card overdue-card">
            <span>Overdue</span>
            <strong>{overdue}</strong>
            <small>⚠️ Past the deadline</small>
          </div>
        </section>

        <section className="progress-panel">
          <div className="progress-copy">
            <div>
              <p className="eyebrow">YOUR ACHIEVEMENTS</p>
              <h2>Completion progress</h2>
            </div>

            <strong>{completionRate}%</strong>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={completionRate}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Assignment completion progress"
          >
            <div
              className="progress-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <p className="progress-note">
            {assignments.length === 0
              ? 'Add your first assignment to start tracking your progress.'
              : `${completed} of ${assignments.length} assignments completed. Keep it up!`}
          </p>
        </section>

        <div className="workspace">
          <section
            className="panel form-panel"
            id="assignment-form"
          >
            <p className="eyebrow">
              {editingId ? 'UPDATE YOUR WORK' : 'PLAN YOUR WORK'}
            </p>

            <h2>
              {editingId ? 'Edit assignment' : 'Add assignment'}
            </h2>

            <form onSubmit={handleSubmit}>
              <label htmlFor="title">Assignment title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Machine Learning Report"
                value={form.title}
                onChange={handleChange}
                required
              />

              <label htmlFor="subject">Subject *</label>
              <input
                id="subject"
                name="subject"
                type="text"
                placeholder="e.g. Data Science"
                value={form.subject}
                onChange={handleChange}
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Add some details..."
                value={form.description}
                onChange={handleChange}
                rows="3"
              />

              <label htmlFor="dueDate">Due date and time *</label>
              <input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                value={form.dueDate}
                onChange={handleChange}
                required
              />

              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? '💾 Update assignment'
                      : '＋ Add assignment'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={resetForm}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section
            className="panel list-panel"
            id="assignment-list"
          >
            <div className="list-heading">
              <div>
                <p className="eyebrow">STAY ORGANISED</p>
                <h2>Your assignments</h2>
              </div>

              <span className="count-badge">
                {filteredAssignments.length}
              </span>
            </div>

            <input
              type="search"
              className="search-input"
              placeholder="🔎 Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search assignments"
            />

            <div className="filter-row">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority"
              >
                <option value="All">All priorities</option>
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>
            </div>

            {(search ||
              statusFilter !== 'All' ||
              priorityFilter !== 'All') && (
              <button
                type="button"
                className="small-btn reset-filters"
                onClick={clearFilters}
              >
                Clear search and filters
              </button>
            )}

            {loading ? (
              <div className="empty">
                <span>⏳</span>
                <p>Loading assignments...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="empty">
                <span>📚</span>
                <h3>Nothing on your list yet</h3>
                <p>Add your first assignment using the form.</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="empty">
                <span>🔎</span>
                <h3>No matching assignments</h3>
                <p>Try another search or change your filters.</p>

                <button
                  type="button"
                  className="small-btn"
                  onClick={clearFilters}
                >
                  Show all assignments
                </button>
              </div>
            ) : (
              <div className="assignment-list">
                {filteredAssignments.map((item) => {
                  const isOverdue =
                    item.status !== 'Completed' &&
                    item.dueDate &&
                    new Date(item.dueDate) < new Date();

                  return (
                    <article
                      className="assignment"
                      key={item._id}
                    >
                      <div className="assignment-top">
                        <div>
                          <h3
                            className={
                              item.status === 'Completed' ? 'done' : ''
                            }
                          >
                            {item.title}
                          </h3>

                          <p className="subject">{item.subject}</p>
                        </div>

                        <span
                          className={`priority ${(item.priority || 'Medium').toLowerCase()}`}
                        >
                          {item.priority || 'Medium'}
                        </span>
                      </div>

                      {item.description && (
                        <p className="description">
                          {item.description}
                        </p>
                      )}

                      <p className={isOverdue ? 'due overdue-text' : 'due'}>
                        {isOverdue ? '⚠️ Overdue · ' : '📅 Due · '}
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleString()
                          : 'No due date'}
                      </p>

                      <div className="assignment-actions">
                        <span
                          className={`status ${item.status === 'Completed' ? 'complete' : ''}`}
                        >
                          {item.status || 'Pending'}
                        </span>

                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => updateStatus(item)}
                        >
                          {item.status === 'Completed'
                            ? '↩ Undo'
                            : '✓ Mark done'}
                        </button>

                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => startEditing(item)}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => deleteAssignment(item._id)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <footer>
          CourseMate · Plan better. Submit on time. ✨
        </footer>
        
<section className="panel" id="about">
  <p className="eyebrow">ABOUT COURSEMATE</p>
  <h2>Your student workspace</h2>

  <p>
    CourseMate is an assignment management application
    designed to help students organise their coursework,
    track deadlines and monitor their progress.
  </p>

  <h3>Features</h3>
  <ul>
    <li>Add and manage assignments</li>
    <li>Edit and delete assignments</li>
    <li>Track pending and completed tasks</li>
    <li>Search assignments and filter by status or priority</li>
    <li>Monitor overdue assignments and completion progress</li>
  </ul>

  <button
    type="button"
    className="primary-btn"
    onClick={() =>
      document.getElementById('dashboard')
        ?.scrollIntoView({ behavior: 'smooth' })
    }
  >
    Back to Dashboard
  </button>
</section>

      </main>
    </div>
  );
}

export default App;