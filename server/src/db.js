import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT),
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE
};

const missingDatabaseValues = Object.entries(dbConfig)
  .filter(([, value]) => value === undefined || value === '' || Number.isNaN(value))
  .map(([key]) => key);

if (missingDatabaseValues.length > 0) {
  throw new Error(`Missing database environment values: ${missingDatabaseValues.join(', ')}`);
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

export default pool;
