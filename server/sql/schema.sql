CREATE DATABASE IF NOT EXISTS student_task_manager;

USE student_task_manager;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  deadline DATE NOT NULL,
  subject ENUM(
    'Automata',
    'App Development',
    'Artificial Intelligent',
    'Sys Fundamentals',
    'Living in IT Era',
    'Effective Coms'
  ) NOT NULL DEFAULT 'App Development',
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tasks_student_id (student_id),
  INDEX idx_tasks_deadline (deadline),
  INDEX idx_tasks_subject (subject),
  INDEX idx_tasks_priority (priority),
  CONSTRAINT fk_tasks_student
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE
);
