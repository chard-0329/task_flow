import { useEffect, useState } from 'react';

const emptyTask = {
  title: '',
  description: '',
  deadline: '',
  subject: '',
  status: 'pending'
};

const subjects = [
  'Automata',
  'App Development',
  'Artificial Intelligent',
  'Sys Fundamentals',
  'Living in IT Era',
  'Effective Coms'
];

function calculatePriority(deadline) {
  if (!deadline) {
    return 'low';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${deadline}T00:00:00`);
  const daysUntilDue = Math.ceil((dueDate - today) / 86400000);

  if (daysUntilDue <= 1) {
    return 'high';
  }

  if (daysUntilDue <= 7) {
    return 'medium';
  }

  return 'low';
}

export default function TaskForm({
  initialValues = emptyTask,
  submitLabel = 'Add task',
  onSubmit,
  onCancel,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState(emptyTask);

  useEffect(() => {
    setFormData({
      title: initialValues.title || '',
      description: initialValues.description || '',
      deadline: initialValues.deadline || '',
      subject: initialValues.subject || '',
      status: initialValues.status || 'pending'
    });
  }, [initialValues]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...formData,
      priority: calculatePriority(formData.deadline)
    });
  }

  return (
    <form className="task-form task-form-clean" onSubmit={handleSubmit}>
      <div className="task-input-row">
        <input
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          maxLength="150"
          placeholder="Add a new task..."
          required
        />
        <input
          name="deadline"
          type="date"
          value={formData.deadline}
          onChange={handleChange}
          aria-label="Deadline"
          required
        />
        <button className="primary-button add-task-button" type="submit" disabled={isSubmitting}>
          <span aria-hidden="true">+</span>
          {isSubmitting ? 'Saving' : submitLabel}
        </button>
      </div>

      <div className="task-select-row">
        <select
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          aria-label="Subject"
          required
        >
          <option value="" disabled>
            Select your subject...
          </option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <select name="status" value={formData.status} onChange={handleChange} aria-label="Status">
          <option value="pending">Active</option>
          <option value="completed">Done</option>
        </select>

        {onCancel && (
          <button className="secondary-button cancel-edit-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
