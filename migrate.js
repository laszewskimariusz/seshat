#!/usr/bin/env node
'use strict';

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rawUrl = process.env.DATABASE_URL ?? 'file:/app/data/seshat.db';
const dbPath = rawUrl.replace(/^file:/, '');

console.log(`[migrate] Opening database at ${dbPath}`);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                  TEXT    NOT NULL PRIMARY KEY,
    "checksum"            TEXT    NOT NULL,
    "finished_at"         DATETIME,
    "migration_name"      TEXT    NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      DATETIME,
    "started_at"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER  NOT NULL DEFAULT 0
  )
`);

const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.log('[migrate] No migrations directory found, skipping.');
  db.close();
  process.exit(0);
}

const applied = new Set(
  db.prepare('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL').all().map(r => r.migration_name)
);

const dirs = fs.readdirSync(migrationsDir)
  .filter(name => fs.statSync(path.join(migrationsDir, name)).isDirectory())
  .sort();

let count = 0;
for (const name of dirs) {
  if (applied.has(name)) continue;

  const sqlFile = path.join(migrationsDir, name, 'migration.sql');
  if (!fs.existsSync(sqlFile)) continue;

  const sql = fs.readFileSync(sqlFile, 'utf8');
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  const id = crypto.randomUUID();

  console.log(`[migrate] Applying: ${name}`);
  db.exec(sql);
  db.prepare(`
    INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
    VALUES (?, ?, datetime('now'), ?, 1)
  `).run(id, checksum, name);

  count++;
}

console.log(`[migrate] Done. ${count} migration(s) applied.`);
db.close();
