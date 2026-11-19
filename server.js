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
    const data = stmt.run(req.params.list_id, req.params.text.trim());

    res.status(201).json(data);
});

// DELETE /cards/:id: delete a card
// 204 deleted | 404 card not found
app.delete('/cards/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
    stmt.run(req.params.id);

    res.status(204).end();
});

app.listen(process.env.PORT, () => {
    console.log(`Listening on http://localhost:${process.env.PORT}`);
});

