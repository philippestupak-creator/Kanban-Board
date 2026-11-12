// app.js: fetch calls and rendering.
// Contract with the server: GET /lists and GET /cards return arrays of rows
// Every change re-fetches and redraws the whole board.

const board = document.getElementById('board');

// ---------- Loading ----------

function loadBoard() {
  fetch('/lists')
    .then(checkResponse)
    .then(parseJson)
    .then(handleListsLoaded)
    .catch(showLoadError);
}

// A missing route comes back as an HTML 404 page, which would make
// response.json() fail with a confusing message. Turn any non-2xx status
// into a clear error first; showLoadError displays it.
function checkResponse(response) {
  if (!response.ok) {
    throw new Error(`${response.url} returned ${response.status}`);
  }
  return response;
}

function parseJson(response) {
  return response.json();
}

// Held between the two fetches so handleCardsLoaded can see the lists.
let loadedLists = [];

function handleListsLoaded(lists) {
  loadedLists = lists;
  // Returned so a failure here also reaches the .catch in loadBoard.
  return fetch('/cards')
    .then(checkResponse)
    .then(parseJson)
    .then(handleCardsLoaded);
}

function handleCardsLoaded(cards) {
  renderBoard(loadedLists, cards);
}

// Shown in place of the columns, so the page shell still appears and says
// what is wrong. A TypeError means fetch itself failed (server not running).
function showLoadError(error) {
  board.innerHTML = '';

  const message = document.createElement('div');
  message.className = 'error';
  if (error instanceof TypeError) {
    message.textContent = "Couldn't reach the server. Is it running?";
  } else {
    message.textContent = `Couldn't load the board: ${error.message}. Has that server route been written yet?`;
  }
  board.appendChild(message);
}

// ---------- Rendering (nested: board -> columns -> cards) ----------

function renderBoard(lists, cards) {
  board.innerHTML = '';

  for (const list of lists) {
    const column = renderColumn(list, cards);
    board.appendChild(column);
  }
}

function renderColumn(list, cards) {
  const column = document.createElement('div');
  column.className = 'column';

  const heading = document.createElement('h2');
  heading.textContent = list.name;
  column.appendChild(heading);

  // The inner loop: only this list's cards.
  for (const card of cards) {
    if (card.list_id === list.id) {
      column.appendChild(renderCard(card));
    }
  }

  const form = document.createElement('form');
  form.className = 'add-form';
  form.dataset.listId = list.id;
  form.onsubmit = handleAddCard;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'New card';
  form.appendChild(input);

  const addButton = document.createElement('button');
  addButton.type = 'submit';
  addButton.textContent = 'Add';
  form.appendChild(addButton);

  column.appendChild(form);
  return column;
}

function renderCard(card) {
  const note = document.createElement('div');
  note.className = 'card';

  // textContent (never innerHTML) so typed HTML shows literally and can't be injected.
  const text = document.createElement('span');
  text.className = 'card-text';
  text.textContent = card.text;
  note.appendChild(text);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '✕';
  deleteButton.dataset.cardId = card.id;
  deleteButton.onclick = handleDeleteCard;
  note.appendChild(deleteButton);

  return note;
}

// ---------- Event handlers ----------

function handleAddCard(event) {
  event.preventDefault();
  const form = event.target;
  const input = form.querySelector('input');

  // The text is part of the URL, so encode it: characters like / ? # would
  // otherwise change the meaning of the path.
  const text = encodeURIComponent(input.value);

  fetch(`/cards/${form.dataset.listId}/${text}`, { method: 'POST' })
    .then(handleAddResponse)
    .catch(showActionError);
}

// On success the board is rebuilt from scratch, which also clears every input.
function handleAddResponse(response) {
  if (!response.ok) {
    alert(`Could not add card (status ${response.status})`);
    return;
  }
  loadBoard();
}

function handleDeleteCard(event) {
  const cardId = event.target.dataset.cardId;

  fetch(`/cards/${cardId}`, { method: 'DELETE' })
    .then(handleDeleteResponse)
    .catch(showActionError);
}

function handleDeleteResponse(response) {
  if (!response.ok) {
    alert(`Could not delete card (status ${response.status})`);
    return;
  }
  loadBoard();
}

// Network-level failure (no response at all) for add or delete.
function showActionError() {
  alert("Couldn't reach the server. Is it running?");
}

loadBoard();