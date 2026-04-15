import pool from './db.js';

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return rows[0].count > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [tableName, indexName]
  );

  return rows[0].count > 0;
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
}

async function addIndexIfMissing(tableName, indexName, definition) {
  if (await indexExists(tableName, indexName)) {
    return;
  }

  await pool.execute(`ALTER TABLE ${tableName} ADD INDEX ${indexName} ${definition}`);
}

export default async function initDatabase() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
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
      CONSTRAINT fk_tasks_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing(
    'tasks',
    'subject',
    `subject ENUM(
      'Automata',
      'App Development',
      'Artificial Intelligent',
      'Sys Fundamentals',
      'Living in IT Era',
      'Effective Coms'
    ) NOT NULL DEFAULT 'App Development' AFTER deadline`
  );
  await addColumnIfMissing(
    'tasks',
    'priority',
    "priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low' AFTER subject"
  );

  await addIndexIfMissing('tasks', 'idx_tasks_student_id', '(student_id)');
  await addIndexIfMissing('tasks', 'idx_tasks_deadline', '(deadline)');
  await addIndexIfMissing('tasks', 'idx_tasks_subject', '(subject)');
  await addIndexIfMissing('tasks', 'idx_tasks_priority', '(priority)');

  await pool.execute(`
    UPDATE tasks
    SET priority = CASE
      WHEN DATEDIFF(deadline, CURDATE()) <= 1 THEN 'high'
      WHEN DATEDIFF(deadline, CURDATE()) <= 7 THEN 'medium'
      ELSE 'low'
    END
  `);
}
