-- schema.sql: creates (or resets) the Kanban database.
-- Run with:  npm run db:reset
-- or in sqlite3:  sqlite3 kanban.db   then   .read schema.sql

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS lists;

CREATE TABLE lists (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE cards (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  text    TEXT NOT NULL CHECK (length(trim(text)) > 0)
);

INSERT INTO lists (name) VALUES ('To Do'), ('Doing'), ('Done');

INSERT INTO cards (list_id, text) VALUES
  (1, 'Example card'),
  (2, 'Another card'),
  (3, 'Set up the repository');
