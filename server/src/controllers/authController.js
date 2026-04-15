import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { cookieName } from '../middleware/auth.js';

function sanitizeStudent(student) {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    created_at: student.created_at
  };
}

function createToken(studentId) {
  return jwt.sign({ studentId }, process.env.JWT_SECRET || 'replace_with_secure_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req, res, next) {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password || '';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO students (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const student = { id: result.insertId, name, email };
    const token = createToken(student.id);

    res.cookie(cookieName, token, cookieOptions());
    return res.status(201).json({ student: sanitizeStudent(student) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, created_at FROM students WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const student = rows[0];
    const passwordMatches = await bcrypt.compare(password, student.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(student.id);
    res.cookie(cookieName, token, cookieOptions());

    return res.json({ student: sanitizeStudent(student) });
  } catch (err) {
    return next(err);
  }
}

export function logout(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  return res.json({ message: 'Logged out successfully.' });
}

export function me(req, res) {
  return res.json({ student: sanitizeStudent(req.student) });
}
