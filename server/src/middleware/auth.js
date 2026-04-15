import jwt from 'jsonwebtoken';
import pool from '../db.js';

const cookieName = 'student_task_token';

export default async function requireAuth(req, res, next) {
  const token = req.cookies[cookieName];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_secure_secret');
    const [rows] = await pool.execute('SELECT id, name, email, created_at FROM students WHERE id = ?', [
      payload.studentId
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    req.student = rows[0];
    return next();
  } catch {
    return res.status(401).json({ message: 'Authentication required.' });
  }
}

export { cookieName };
