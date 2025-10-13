import Database from 'better-sqlite3';
import { dirname, join, basename } from 'path';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultDbPath = join(__dirname, '../database.db');
const dbFilePath = (process.env.DB_PATH && process.env.DB_PATH.trim()) ? process.env.DB_PATH : defaultDbPath;
const backupDir = process.env.DB_BACKUP_DIR || join(dirname(dbFilePath), 'backups');

try {
  const dbDirPath = dirname(dbFilePath);
  if (!existsSync(dbDirPath)) {
    mkdirSync(dbDirPath, { recursive: true });
  }
} catch (e) {
  console.error('Failed to ensure DB directory:', e.message);
  process.exit(1);
}

if (!existsSync(backupDir)) {
  console.error(`Backup directory does not exist: ${backupDir}`);
  process.exit(1);
}

// Find the latest backup file by timestamp in filename
const backups = readdirSync(backupDir)
  .filter((f) => f.startsWith('backup-') && f.endsWith('.sqlite'))
  .sort((a, b) => (a > b ? -1 : 1));

if (backups.length === 0) {
  console.error('No backup files found to restore from');
  process.exit(1);
}

const latestBackup = backups[0];
const latestBackupPath = join(backupDir, latestBackup);

try {
  // Use simple copy for restore while server is not running
  copyFileSync(latestBackupPath, dbFilePath);
  console.log(`Restored DB from ${basename(latestBackup)}`);
} catch (e) {
  console.error('Failed to restore database:', e.message);
  process.exit(1);
}


