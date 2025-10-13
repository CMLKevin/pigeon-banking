import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultDbPath = join(__dirname, '../database.db');
const dbFilePath = (process.env.DB_PATH && process.env.DB_PATH.trim()) ? process.env.DB_PATH : defaultDbPath;

const backupDir = process.env.DB_BACKUP_DIR || join(dirname(dbFilePath), 'backups');

try {
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
} catch (e) {
  console.error('Failed to ensure backup directory:', e.message);
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[-:T]/g, '')
  .replace(/\..+/, '');

const backupFilePath = join(backupDir, `backup-${timestamp}.sqlite`);

try {
  const db = new Database(dbFilePath, { readonly: true });
  db.backup(backupFilePath)
    .then(() => {
      console.log(`Backup created at ${backupFilePath}`);
      db.close();
    })
    .catch((err) => {
      console.error('Backup failed:', err.message);
      process.exit(1);
    });
} catch (e) {
  console.error('Failed to open database for backup:', e.message);
  process.exit(1);
}


