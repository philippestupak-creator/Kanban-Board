const express = require('express');
const app = express();

app.use(express.static('public'));
process.loadEnvFile('.env');

app.listen(process.env.PORT);

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