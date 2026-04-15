import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import app from './app.js';
import initDatabase from './initDb.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const port = process.env.PORT || 3000;

try {
  await initDatabase();

  app.listen(port, () => {
    console.log(`API server running on port ${port}`);
  });
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}
