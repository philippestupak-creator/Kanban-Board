// db-setup.js: builds a fresh kanban.db from schema.sql.
// Usage: npm run db:reset   (uses Node's built-in sqlite, no install needed)
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbFile = path.join(__dirname, 'kanban.db');
const schemaFile = path.join(__dirname, 'schema.sql');

// Remove the old database (and any leftover journal files) so we start clean.
for (const file of [dbFile, `${dbFile}-shm`, `${dbFile}-wal`]) {
  fs.rmSync(file, { force: true });
}

const db = new DatabaseSync(dbFile);
db.exec(fs.readFileSync(schemaFile, 'utf8'));

console.log('Created', path.basename(dbFile));
console.log('lists:');
console.table(db.prepare('SELECT * FROM lists').all());
console.log('cards:');
console.table(db.prepare('SELECT * FROM cards').all());

db.close();
