const express = require('express');
const app = express();

app.use(express.static('public'));
process.loadEnvFile('.env');

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('kanban.db');

const lists = [
  { id: 1, name: 'To Do' },
  { id: 2, name: 'Doing' },
  { id: 3, name: 'Done' }
];

let cards = [
  { id: 1, list_id: 1, text: 'Example card' },
  { id: 2, list_id: 2, text: 'Another card' }
];


app.get('/lists', (req, res) => {
    const stmt = db.prepare('SELECT name,id FROM lists order by id');
    const data = stmt.all();
    res.json(data);
});

app.get('/cards', (req, res) => {
    const stmt = db.prepare('SELECT id,list_id,text FROM cards order by id');
    const cards = stmt.all();
    res.json(cards);
});

// POST /cards/:list_id/:text: create a card
// 201 created | 400 blank text | 404 list not found
app.post('/cards/:list_id/:text', (req, res) => {
    if (req.params.text.trim() === '') {
        res.status(400).json({ error: 'Blank text' });
        return;
    }
    const stmt = db.prepare('INSERT INTO cards values (null, ?, ?) returning *');
    const data = stmt.get(req.params.list_id, req.params.text.trim());

    res.status(201).json(data);
});

// DELETE /cards/:id: delete a card
// 204 deleted | 404 card not found
app.delete('/cards/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
    stmt.run(req.params.id);

    res.status(204).end();
});

app.delete('/lists/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM lists WHERE id = ?');
    stmt.run(req.params.id);
    
    res.status(204).end();
});

// ---------- Routes still to write (needed by the v2 client) ----------
// The client re-fetches GET /lists and GET /cards after every change and only
// checks the status code, so the response bodies below are not read by the
// browser. They still matter for testing with curl.
//
// Row shapes used below:
//   list row: { "id": 4, "name": "Review" }
//   card row: { "id": 1, "list_id": 2, "text": "Example card" }
//
// Error responses (400 and 404) send a JSON body: { "error": "<message>" }

// POST /lists/:name: create a list
// 201 created | 400 blank name (after trimming)
// Body on 201: the new list row, e.g. { "id": 4, "name": "Review" }
// Store the trimmed name.

// DELETE /lists/:id: delete a list and all of its cards
// 204 deleted | 400 id is not a number | 404 list not found
// Body on 204: none (empty).
// The cards go with the list because of ON DELETE CASCADE in schema.sql.

// PUT /cards/:id/:text: edit a card's text
// 200 updated | 400 id is not a number or text is blank (after trimming) | 404 card not found
// Body on 200: the updated card row, e.g. { "id": 1, "list_id": 2, "text": "new text" }
// Store the trimmed text.
app.put('/cards/:id/:text', (req, res) => {
    if (req.params.text.trim() === '') {
        res.status(400).json({ error: 'Blank text' });
        return;
    }
    const stmt = db.prepare('UPDATE cards SET text = ? WHERE id = ? returning *');
    const data = stmt.get(req.params.text.trim(), req.params.id);

    res.json(data);
});

// PUT /cards/:id/list/:list_id: move a card to another list (drag and drop)
// 200 moved | 400 id or list_id is not a number | 404 card not found or list not found
// Body on 200: the updated card row, e.g. { "id": 1, "list_id": 3, "text": "Example card" }
// This route has four path segments, so it does not conflict with
// PUT /cards/:id/:text, which has three.
app.put('/cards/:id/list/:list_id', (req, res) => {
    if (req.params.list_id.trim() === '') {
        res.status(400).json({ error: 'Blank list_id' });
        return;
    }
    const stmt = db.prepare('UPDATE cards SET list_id = ? WHERE id = ? returning *');
    const data = stmt.get(req.params.list_id, req.params.id);

    res.json(data);
});

app.listen(process.env.PORT, () => {
    console.log(`Listening on http://localhost:${process.env.PORT}`);
});

