import pool from '../db.js';

const allowedStatuses = new Set(['pending', 'completed']);
const allowedSubjects = new Set([
  'Automata',
  'App Development',
  'Artificial Intelligent',
  'Sys Fundamentals',
  'Living in IT Era',
  'Effective Coms'
]);

function calculatePriority(deadline) {
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

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function validateTaskInput(body) {
  const title = body.title?.trim();
  const description = body.description?.trim() || null;
  const deadline = body.deadline;
  const subject = body.subject?.trim();
  const status = body.status || 'pending';

  if (!title) {
    return { error: 'Task title is required.' };
  }

  if (title.length > 150) {
    return { error: 'Task title must be 150 characters or less.' };
  }

  if (!isValidDate(deadline)) {
    return { error: 'A valid deadline is required.' };
  }

  if (!allowedSubjects.has(subject)) {
    return { error: 'Please select a valid subject.' };
  }

  if (!allowedStatuses.has(status)) {
    return { error: 'Status must be pending or completed.' };
  }

  return {
    task: {
      title,
      description,
      deadline,
      subject,
      priority: calculatePriority(deadline),
      status
    }
  };
}

export async function getTasks(req, res, next) {
  try {
    const [tasks] = await pool.execute(
      `SELECT id, student_id, title, description, deadline, subject, priority, status, created_at, updated_at
       FROM tasks
       WHERE student_id = ?
       ORDER BY deadline ASC, created_at DESC`,
      [req.student.id]
    );

    return res.json({ tasks });
  } catch (err) {
    return next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const validation = validateTaskInput(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { title, description, deadline, subject, priority, status } = validation.task;
    const [result] = await pool.execute(
      `INSERT INTO tasks (student_id, title, description, deadline, subject, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.student.id, title, description, deadline, subject, priority, status]
    );

    const [rows] = await pool.execute(
      `SELECT id, student_id, title, description, deadline, subject, priority, status, created_at, updated_at
       FROM tasks
       WHERE id = ? AND student_id = ?`,
      [result.insertId, req.student.id]
    );

    return res.status(201).json({ task: rows[0] });
  } catch (err) {
    return next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const validation = validateTaskInput(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { title, description, deadline, subject, priority, status } = validation.task;
    const [result] = await pool.execute(
      `UPDATE tasks
       SET title = ?, description = ?, deadline = ?, subject = ?, priority = ?, status = ?
       WHERE id = ? AND student_id = ?`,
      [title, description, deadline, subject, priority, status, req.params.id, req.student.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const [rows] = await pool.execute(
      `SELECT id, student_id, title, description, deadline, subject, priority, status, created_at, updated_at
       FROM tasks
       WHERE id = ? AND student_id = ?`,
      [req.params.id, req.student.id]
    );

    return res.json({ task: rows[0] });
  } catch (err) {
    return next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ? AND student_id = ?', [
      req.params.id,
      req.student.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    return next(err);
  }
}
