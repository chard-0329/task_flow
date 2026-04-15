function formatDeadline(deadline) {
  if (!deadline) {
    return 'No deadline';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(`${deadline}T00:00:00`));
}

function isOverdue(task) {
  if (task.status === 'completed' || !task.deadline) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(`${task.deadline}T00:00:00`);

  return deadline < today;
}

export default function TaskItem({ task, onEdit, onDelete, onToggleStatus }) {
  const overdue = isOverdue(task);
  const itemClassName = [
    'task-item',
    task.status === 'completed' ? 'task-completed' : '',
    overdue ? 'task-overdue' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={itemClassName}>
      <div className="task-check">
        <button
          className="task-circle"
          type="button"
          onClick={() => onToggleStatus(task)}
          aria-label={task.status === 'completed' ? 'Mark task active' : 'Mark task done'}
        >
          {task.status === 'completed' ? '✓' : ''}
        </button>
      </div>

      <div className="task-content">
        <div className="task-title-line">
          <h3>{task.title}</h3>
          <span className="deadline">{formatDeadline(task.deadline)}</span>
        </div>

        <div className="task-chip-row">
          {task.subject && <span className="subject-chip">{task.subject}</span>}
          <span className={`priority-chip priority-${task.priority || 'low'}`}>
            {task.priority || 'low'}
          </span>
          <span className={`status-pill status-${task.status}`}>
            {task.status === 'completed' ? 'Done' : 'Active'}
          </span>
          {overdue && <span className="overdue-label">Overdue</span>}
        </div>
      </div>

      <div className="task-actions" aria-label={`Actions for ${task.title}`}>
        <button className="ghost-button" type="button" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="ghost-button danger-text" type="button" onClick={() => onDelete(task.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
