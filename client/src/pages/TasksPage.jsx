import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function parseDeadline(deadline) {
  if (!deadline) {
    return null;
  }

  const date = new Date(`${deadline}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(deadline) {
  const date = parseDeadline(deadline);

  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((date - today) / 86400000);
}

function StatCard({ icon, tone, value, label }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon stat-${tone}`}>{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function ProgressBar({ value, tone = 'blue' }) {
  return (
    <div className="meter" aria-hidden="true">
      <span className={`meter-fill meter-${tone}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default function TasksPage() {
  const { student, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [editingTask, setEditingTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [createFormVersion, setCreateFormVersion] = useState(0);

  const completedTasks = tasks.filter((task) => task.status === 'completed');
  const activeTasks = tasks.filter((task) => task.status !== 'completed');
  const overdueTasks = activeTasks.filter((task) => daysUntil(task.deadline) < 0);
  const dueSoonTasks = activeTasks.filter((task) => {
    const days = daysUntil(task.deadline);
    return days >= 0 && days <= 7;
  });
  const laterTasks = activeTasks.filter((task) => daysUntil(task.deadline) > 7);
  const completionPercent =
    tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleCreate(formData) {
    setIsSaving(true);
    setError('');

    try {
      await api.post('/tasks', formData);
      setCreateFormVersion((current) => current + 1);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add task.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(formData) {
    if (!editingTask) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await api.put(`/tasks/${editingTask.id}`, formData);
      setEditingTask(null);
      setActiveView('tasks');
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update task.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(taskId) {
    const shouldDelete = window.confirm('Delete this task? This cannot be undone.');

    if (!shouldDelete) {
      return;
    }

    setError('');

    try {
      await api.delete(`/tasks/${taskId}`);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete task.');
    }
  }

  async function handleToggleStatus(task) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: nextStatus });
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update task status.');
    }
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M8.6 12.7 11 15.1l5-6" />
              <rect x="4" y="4" width="16" height="16" rx="3" />
            </svg>
          </span>
          <div>
            <h1>TaskFlow</h1>
            <p>Stay organized, {student?.name}</p>
          </div>
        </div>

        <div className="header-actions">
          <span className="task-count">{tasks.length} tasks</span>
          <button className="avatar-button" type="button" onClick={handleLogout} title="Log out">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
            </svg>
            <span className="sr-only">Log out</span>
          </button>
        </div>
      </header>

      <nav className="view-switch" aria-label="Task manager views">
        <button
          className={activeView === 'tasks' ? 'active' : ''}
          type="button"
          onClick={() => setActiveView('tasks')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 7h8M9 12h8M9 17h8M5 7h.01M5 12h.01M5 17h.01" />
          </svg>
          Tasks
        </button>
        <button
          className={activeView === 'dashboard' ? 'active' : ''}
          type="button"
          onClick={() => setActiveView('dashboard')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
          </svg>
          Dashboard
        </button>
      </nav>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="stats-grid" aria-label="Task summary">
        <StatCard icon="◎" tone="navy" value={tasks.length} label="Total Tasks" />
        <StatCard icon="✓" tone="blue" value={completedTasks.length} label="Completed" />
        <StatCard icon="◷" tone="orange" value={activeTasks.length} label="Active" />
        <StatCard icon="!" tone="red" value={overdueTasks.length} label="High Priority" />
      </section>

      {activeView === 'dashboard' && (
        <section className="dashboard-grid">
          <article className="dashboard-card dashboard-card-wide">
            <div className="card-title">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 15 4-4 3 3 6-7M5 19h14" />
              </svg>
              <h2>Overall Progress</h2>
            </div>
            <div className="progress-row">
              <ProgressBar value={completionPercent} />
              <strong>{completionPercent} %</strong>
            </div>
            <p className="card-note">
              {completedTasks.length} of {tasks.length} tasks completed
            </p>
          </article>

          <article className="dashboard-card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 19V5m4 14v-7m4 7V9m4 10V4" />
              </svg>
              <h2>Tasks by Status</h2>
            </div>
            <div className="breakdown-list">
              <div>
                <span>Completed</span>
                <small>{completedTasks.length}/{tasks.length || 0}</small>
                <ProgressBar value={completionPercent} tone="purple" />
              </div>
              <div>
                <span>Active</span>
                <small>{activeTasks.length}/{tasks.length || 0}</small>
                <ProgressBar
                  value={tasks.length === 0 ? 0 : Math.round((activeTasks.length / tasks.length) * 100)}
                  tone="orange"
                />
              </div>
              <div>
                <span>Overdue</span>
                <small>{overdueTasks.length}/{tasks.length || 0}</small>
                <ProgressBar
                  value={tasks.length === 0 ? 0 : Math.round((overdueTasks.length / tasks.length) * 100)}
                  tone="red"
                />
              </div>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m12 4 9 16H3L12 4Zm0 6v4m0 3h.01" />
              </svg>
              <h2>Priority Breakdown</h2>
            </div>
            <div className="breakdown-list">
              <div>
                <span>High Priority</span>
                <small>{overdueTasks.length} overdue</small>
                <ProgressBar
                  value={activeTasks.length === 0 ? 0 : Math.round((overdueTasks.length / activeTasks.length) * 100)}
                  tone="red"
                />
              </div>
              <div>
                <span>Medium Priority</span>
                <small>{dueSoonTasks.length} due soon</small>
                <ProgressBar
                  value={activeTasks.length === 0 ? 0 : Math.round((dueSoonTasks.length / activeTasks.length) * 100)}
                />
              </div>
              <div>
                <span>Low Priority</span>
                <small>{laterTasks.length} later</small>
                <ProgressBar
                  value={activeTasks.length === 0 ? 0 : Math.round((laterTasks.length / activeTasks.length) * 100)}
                  tone="gray"
                />
              </div>
            </div>
          </article>

          <article className="dashboard-card dashboard-card-wide">
            <div className="card-title">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h2>Recently Completed</h2>
            </div>
            <div className="recent-list">
              {completedTasks.slice(0, 4).map((task) => (
                <div className="recent-row" key={task.id}>
                  <span>✓</span>
                  <strong>{task.title}</strong>
                  <small>{task.deadline}</small>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p className="card-note">Completed tasks will appear here.</p>
              )}
            </div>
          </article>
        </section>
      )}

      {activeView === 'tasks' && (
        <section className="task-workspace">
          <section className="task-editor" aria-labelledby="task-form-title">
            <h2 id="task-form-title">{editingTask ? 'Edit task' : 'Add task'}</h2>
            <TaskForm
              key={editingTask ? `edit-${editingTask.id}` : `create-${createFormVersion}`}
              initialValues={editingTask || undefined}
              submitLabel={editingTask ? 'Save changes' : 'Add task'}
              onSubmit={editingTask ? handleUpdate : handleCreate}
              onCancel={editingTask ? () => setEditingTask(null) : undefined}
              isSubmitting={isSaving}
            />
          </section>

          <section className="tasks-panel" aria-labelledby="tasks-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">My tasks</p>
                <h2 id="tasks-title">Deadlines</h2>
              </div>
              <span className="task-count">{tasks.length} total</span>
            </div>

            {isLoading ? (
              <div className="screen-message">Loading tasks...</div>
            ) : (
              <TaskList
                tasks={tasks}
                onEdit={(task) => {
                  setEditingTask(task);
                  setActiveView('tasks');
                }}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </section>
        </section>
      )}
    </main>
  );
}
