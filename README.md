# Kanban-Board

## Database setup

The database file (`kanban.db`) is **not** committed to Git. Each person builds their own copy from `schema.sql`. Run the same steps again any time you want to reset the data.

**Option A: Node (no extra install needed, requires Node 22.5+)**

```
npm run db:reset
```

This deletes any existing `kanban.db`, runs `schema.sql`, and prints the lists and cards so you can check them.

**Option B: sqlite3 command line**

This needs the real `sqlite3` program:

- Windows: `winget install SQLite.SQLite`, then open a **new** terminal
- Mac: `brew install sqlite`
- The Linux server (`users.csci.io`) already has it.

Check it's installed with `sqlite3 --version`. 
(you may have to close vscode and reopen it before showing the version works)

> ⚠️ `python -m sqlite3` will **not** work. Python's shell doesn't support `.read`, so you'll get `near ".": syntax error`.

Steps:

1. Delete `kanban.db` if it exists.
2. `sqlite3 kanban.db`
3. `.read schema.sql`
4. `.mode box` (makes the output a readable table)
5. `SELECT * FROM lists;` should show 3 lists, and `SELECT * FROM cards;` should show 3 cards.
6. `.exit`

Dot-commands (`.read`, `.mode`, `.exit`) take **no** semicolon. SQL statements (`SELECT ...;`) **do**.

Or do it in one line without opening the shell:

```
sqlite3 kanban.db ".read schema.sql"
sqlite3 -box kanban.db "SELECT * FROM lists; SELECT * FROM cards;"
```
