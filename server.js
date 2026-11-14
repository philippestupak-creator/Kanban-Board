const express = require('express');
const app = express();

app.use(express.static('public'));
process.loadEnvFile('.env');


// GET /lists: all lists (the UI expects exactly 3)
app.get('/lists', (req, res) => {
  res.json([]);   // TODO: SELECT * FROM lists
});

// GET /cards: all cards ({ id, list_id, text })
app.get('/cards', (req, res) => {
  res.json([]);   // TODO: SELECT * FROM cards
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
