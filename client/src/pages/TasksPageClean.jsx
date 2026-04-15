import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const subjects = [
  'Automata',
  'App Development',
  'Artificial Intelligent',
  'Sys Fundamentals',
  'Living in IT Era',
  'Effective Coms'
];

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

export default function TasksPageClean() {
  const { student, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('tasks');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [createFormVersion, setCreateFormVersion] = useState(0);

  const completedTasks = tasks.filter((task) => task.status === 'completed');
  const activeTasks = tasks.filter((task) => task.status !== 'completed');
  const highPriorityTasks = activeTasks.filter((task) => task.priority === 'high');
  const mediumPriorityTasks = activeTasks.filter((task) => task.priority === 'medium');
  const lowPriorityTasks = activeTasks.filter((task) => task.priority === 'low');
  const completionPercent =
    tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);
  const filteredTasks = tasks.filter((task) => {
    const matchesSubject = subjectFilter === 'All' || task.subject === subjectFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && task.status !== 'completed') ||
      (statusFilter === 'done' && task.status === 'completed');

    return matchesSubject && matchesStatus;
  });

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

  async function handleClearDone() {
    if (completedTasks.length === 0) {
      return;
    }

    const shouldClear = window.confirm('Clear all completed tasks?');

    if (!shouldClear) {
      return;
    }

    try {
      await Promise.all(completedTasks.map((task) => api.delete(`/tasks/${task.id}`)));
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to clear completed tasks.');
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

      {activeView === 'tasks' && (
        <section className="tasks-view">
          <section className="task-composer" aria-labelledby="task-form-title">
            <h2 className="sr-only" id="task-form-title">
              {editingTask ? 'Edit task' : 'Add task'}
            </h2>
            <TaskForm
              key={editingTask ? `edit-${editingTask.id}` : `create-${createFormVersion}`}
              initialValues={editingTask || undefined}
              submitLabel={editingTask ? 'Save' : 'Add'}
              onSubmit={editingTask ? handleUpdate : handleCreate}
              onCancel={editingTask ? () => setEditingTask(null) : undefined}
              isSubmitting={isSaving}
            />
          </section>

          <section className="subject-filter" aria-label="Subject filters">
            <button
              className={subjectFilter === 'All' ? 'active' : ''}
              type="button"
              onClick={() => setSubjectFilter('All')}
            >
              All
            </button>
            {subjects.map((subject) => (
              <button
                className={subjectFilter === subject ? 'active' : ''}
                key={subject}
                type="button"
                onClick={() => setSubjectFilter(subject)}
              >
                {subject}
              </button>
            ))}
          </section>

          <section className="task-board" aria-labelledby="tasks-title">
            <div className="task-tabs">
              <div className="task-tab-group" role="tablist" aria-label="Task status filters">
                <button
                  className={statusFilter === 'all' ? 'active' : ''}
                  type="button"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({tasks.length})
                </button>
                <button
                  className={statusFilter === 'active' ? 'active' : ''}
                  type="button"
                  onClick={() => setStatusFilter('active')}
                >
                  Active ({activeTasks.length})
                </button>
                <button
                  className={statusFilter === 'done' ? 'active' : ''}
                  type="button"
                  onClick={() => setStatusFilter('done')}
                >
                  Done ({completedTasks.length})
                </button>
              </div>
              <button className="clear-done-button" type="button" onClick={handleClearDone}>
                Clear done
              </button>
            </div>

            {isLoading ? (
              <div className="screen-message">Loading tasks...</div>
            ) : (
              <TaskList
                tasks={filteredTasks}
                onEdit={(task) => {
                  setEditingTask(task);
                  setActiveView('tasks');
                }}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            )}

            <div className="task-progress-footer">
              <ProgressBar value={completionPercent} />
              <span>{completionPercent}% done</span>
            </div>
          </section>
        </section>
      )}

      {activeView === 'dashboard' && (
        <>
          <section className="stats-grid" aria-label="Task summary">
            <StatCard icon="T" tone="navy" value={tasks.length} label="Total Tasks" />
            <StatCard icon="C" tone="blue" value={completedTasks.length} label="Completed" />
            <StatCard icon="A" tone="orange" value={activeTasks.length} label="Active" />
            <StatCard icon="!" tone="red" value={highPriorityTasks.length} label="High Priority" />
          </section>

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
                <h2>Tasks by Subject</h2>
              </div>
              <div className="breakdown-list">
                {subjects.map((subject) => {
                  const subjectCount = tasks.filter((task) => task.subject === subject).length;
                  const subjectPercent =
                    tasks.length === 0 ? 0 : Math.round((subjectCount / tasks.length) * 100);

                  return (
                    <div key={subject}>
                      <span>{subject}</span>
                      <small>{subjectCount}/{tasks.length || 0}</small>
                      <ProgressBar value={subjectPercent} tone={subject === 'App Development' ? 'blue' : 'gray'} />
                    </div>
                  );
                })}
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
                  <small>{highPriorityTasks.length} due now</small>
                  <ProgressBar
                    value={activeTasks.length === 0 ? 0 : Math.round((highPriorityTasks.length / activeTasks.length) * 100)}
                    tone="red"
                  />
                </div>
                <div>
                  <span>Medium Priority</span>
                  <small>{mediumPriorityTasks.length} this week</small>
                  <ProgressBar
                    value={activeTasks.length === 0 ? 0 : Math.round((mediumPriorityTasks.length / activeTasks.length) * 100)}
                  />
                </div>
                <div>
                  <span>Low Priority</span>
                  <small>{lowPriorityTasks.length} later</small>
                  <ProgressBar
                    value={activeTasks.length === 0 ? 0 : Math.round((lowPriorityTasks.length / activeTasks.length) * 100)}
                    tone="gray"
                  />
                </div>
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
