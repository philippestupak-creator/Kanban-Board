const express = require('express');
const app = express();

app.use(express.static('public'));
process.loadEnvFile('.env');

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
  res.json(lists);
});

app.get('/cards', (req, res) => {
  res.json(cards);
});

// POST /cards/:list_id/:text: create a card
// 201 created | 400 blank text | 404 list not found
app.post('/cards/:list_id/:text', (req, res) => {
  res.status(201).json({});   // TODO: INSERT and return the new card
});

// DELETE /cards/:id: delete a card
// 204 deleted | 404 card not found
app.delete('/cards/:id', (req, res) => {
  res.status(204).end();   // TODO: DELETE FROM cards WHERE id = ?
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on http://localhost:${process.env.PORT}`);
});

