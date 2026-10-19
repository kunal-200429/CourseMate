
import { useCallback, useEffect, useState } from 'react';
import './App.css';

const API = 'http://localhost:5000/api/assignments';

const emptyForm = {
  title: '',
  subject: '',
  description: '',
  dueDate: '',
  priority: 'Medium',
};

function toLocalDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

async function readResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(error, fallback) {
  if (error instanceof TypeError) {
    return 'Cannot connect to the backend. Make sure the server is running on port 5000.';
  }

  return error?.message || fallback;
}

function App() {
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ ...emptyForm });

  const loadAssignments = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);

    try {
      const response = await fetch(API);
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not load assignments.');
      }

      if (!Array.isArray(data)) {
        throw new Error('Unexpected response from the server.');
      }

      setAssignments(data);
      setError('');
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load assignments.'));
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments(true);
  }, [loadAssignments]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError('');
    setSuccess('');
  }

  function validateForm() {
    if (!form.title.trim()) return 'Please enter an assignment title.';
    if (!form.subject.trim()) return 'Please enter the subject.';
    if (!form.dueDate) return 'Please select a due date and time.';

    const dueDate = new Date(form.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      return 'Please select a valid due date.';
    }

    if (!['Low', 'Medium', 'High'].includes(form.priority)) {
      return 'Please select a valid priority.';
    }

    if (form.title.trim().length > 100) {
      return 'Title cannot exceed 100 characters.';
    }

    if (form.subject.trim().length > 100) {
      return 'Subject cannot exceed 100 characters.';
    }

    if (form.description.length > 1000) {
      return 'Description cannot exceed 1000 characters.';
    }

    return '';
  }

  async function submitAssignment(event) {
    event.preventDefault();

    if (saving) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const isEditing = Boolean(editingId);
    const url = isEditing ? `${API}/${editingId}` : API;

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      description: form.description.trim(),
      dueDate: new Date(form.dueDate).toISOString(),
      priority: form.priority,
    };

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not save the assignment.');
      }

      setForm({ ...emptyForm });
      setEditingId(null);
      setSuccess(
        isEditing
          ? 'Assignment updated successfully.'
          : 'Assignment added successfully.'
      );

      await loadAssignments();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save the assignment.'));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item) {
    if (!item?._id) {
      setError('Could not identify this assignment.');
      return;
    }

    setForm({
      title: item.title || '',
      subject: item.subject || '',
      description: item.description || '',
      dueDate: toLocalDateTime(item.dueDate),
      priority: item.priority || 'Medium',
    });

    setEditingId(item._id);
    setError('');
    setSuccess('');

    document.querySelector('.form-panel')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  async function updateStatus(item) {
    if (!item?._id || busyId) return;

    const nextStatus =
      item.status === 'Completed' ? 'Pending' : 'Completed';

    setBusyId(item._id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API}/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not update assignment status.');
      }

      setSuccess(
        nextStatus === 'Completed'
          ? 'Assignment marked as completed.'
          : 'Assignment moved back to pending.'
      );

      await loadAssignments();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update assignment status.'));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAssignment(id) {
    if (!id || busyId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this assignment? This action cannot be undone.'
    );

    if (!confirmed) return;

    setBusyId(id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API}/${id}`, {
        method: 'DELETE',
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete the assignment.');
      }

      if (editingId === id) {
        setForm({ ...emptyForm });
        setEditingId(null);
      }

      setSuccess('Assignment deleted successfully.');
      await loadAssignments();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete the assignment.'));
    } finally {
      setBusyId(null);
    }
  }

  const completed = assignments.filter(
    (item) => item.status === 'Completed'
  ).length;

  const pending = assignments.length - completed;

  const overdue = assignments.filter((item) => {
    const due = new Date(item.dueDate);

    return (
      item.status !== 'Completed' &&
      !Number.isNaN(due.getTime()) &&
      due < new Date()
    );
  }).length;

  const filteredAssignments = assignments.filter((item) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      (item.title || '').toLowerCase().includes(search) ||
      (item.subject || '').toLowerCase().includes(search) ||
      (item.description || '').toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === 'All' ||
      (item.status || 'Pending') === statusFilter;

    const matchesPriority =
      priorityFilter === 'All' ||
      (item.priority || 'Medium') === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('All');
    setPriorityFilter('All');
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          Course<span>Mate</span>
        </a>
        <span className="tagline">Your coursework, under control.</span>
      </header>

      <main className="container">
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
          <div className="hero-icon" aria-hidden="true">
            🎓
          </div>
        </section>

        <section className="stats" aria-label="Assignment statistics">
          <div className="stat-card">
            <span>Total assignments</span>
            <strong>{assignments.length}</strong>
          </div>
          <div className="stat-card">
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>
          <div className="stat-card">
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>
          <div className="stat-card overdue-card">
            <span>Overdue</span>
            <strong>{overdue}</strong>
          </div>
        </section>

        <div className="workspace">
          <section className="panel form-panel">
            <p className="eyebrow">PLAN YOUR WORK</p>
            <h2>{editingId ? 'Edit assignment' : 'Add assignment'}</h2>

            <form onSubmit={submitAssignment}>
              <label>
                Assignment title
                <input
                  required
                  maxLength={100}
                  placeholder="e.g. MERN Stack PoC"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </label>

              <label>
                Subject
                <input
                  required
                  maxLength={100}
                  placeholder="e.g. Full Stack Development"
                  value={form.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                />
              </label>

              <label>
                Description
                <textarea
                  maxLength={1000}
                  placeholder="What do you need to complete?"
                  value={form.description}
                  onChange={(e) =>
                    updateField('description', e.target.value)
                  }
                />
                <span className="field-hint">
                  {form.description.length}/1000 characters
                </span>
              </label>

              <label>
                Due date and time
                <input
                  required
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </label>

              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(e) => updateField('priority', e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <div className="form-actions">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save changes'
                      : '+ Add assignment'}
                </button>

                {editingId && (
                  <button
                    className="small-btn"
                    type="button"
                    disabled={saving}
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="panel list-panel">
            <div className="list-heading">
              <div>
                <p className="eyebrow">YOUR COURSEWORK</p>
                <h2>My assignments</h2>
              </div>
              <span className="count">
                {filteredAssignments.length} of {assignments.length}
              </span>
            </div>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="success-message" role="status">
                {success}
              </p>
            )}

            <div className="assignment-filters">
              <input
                type="search"
                aria-label="Search assignments"
                placeholder="Search title, subject or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                aria-label="Filter assignments by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                aria-label="Filter assignments by priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="All">All priorities</option>
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>
            </div>

            {(searchTerm ||
              statusFilter !== 'All' ||
              priorityFilter !== 'All') && (
              <button
                type="button"
                className="small-btn reset-filters"
                onClick={resetFilters}
              >
                Clear search and filters
              </button>
            )}

            {loading ? (
              <p className="empty">Loading assignments...</p>
            ) : assignments.length === 0 ? (
              <div className="empty">
                <span>📚</span>
                <h3>Nothing on your list yet</h3>
                <p>Add your first assignment using the form.</p>
                {!error && (
                  <button
                    type="button"
                    className="small-btn"
                    onClick={() => loadAssignments(true)}
                  >
                    Refresh assignments
                  </button>
                )}
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="empty">
                <span>🔎</span>
                <h3>No matching assignments</h3>
                <p>Try a different search or change your filters.</p>
                <button
                  type="button"
                  className="small-btn"
                  onClick={resetFilters}
                >
                  Show all assignments
                </button>
              </div>
            ) : (
              <div className="assignment-list">
                {filteredAssignments.map((item) => {
                  const dueDate = new Date(item.dueDate);
                  const validDueDate = !Number.isNaN(dueDate.getTime());
                  const isOverdue =
                    item.status !== 'Completed' &&
                    validDueDate &&
                    dueDate < new Date();

                  const itemBusy = busyId === item._id;

                  return (
                    <article className="assignment" key={item._id}>
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
                        <p className="description">{item.description}</p>
                      )}

                      <p className={isOverdue ? 'due overdue-text' : 'due'}>
                        {isOverdue ? '⚠ Overdue · ' : '📅 Due · '}
                        {validDueDate
                          ? dueDate.toLocaleString()
                          : 'Date unavailable'}
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
                          disabled={Boolean(busyId)}
                          onClick={() => updateStatus(item)}
                        >
                          {itemBusy
                            ? 'Updating...'
                            : item.status === 'Completed'
                              ? 'Undo'
                              : 'Mark done'}
                        </button>

                        <button
                          type="button"
                          className="small-btn"
                          disabled={Boolean(busyId) || saving}
                          onClick={() => startEditing(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          disabled={Boolean(busyId) || saving}
                          onClick={() => deleteAssignment(item._id)}
                        >
                          {itemBusy ? 'Please wait...' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <footer>CourseMate · Plan better. Submit on time.</footer>
      </main>
    </div>
  );
}

export default App;
