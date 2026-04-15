import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, onEdit, onDelete, onToggleStatus }) {
  if (tasks.length === 0) {
    return (
      <section className="empty-state">
        <h2>No tasks yet</h2>
        <p>Add your first task to start tracking upcoming deadlines.</p>
      </section>
    );
  }

  return (
    <section className="task-list" aria-label="Task list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </section>
  );
}
