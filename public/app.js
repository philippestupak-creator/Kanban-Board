// app.js: fetch calls and rendering.
// Contract with the server: GET /lists and GET /cards return arrays of rows
// (see store.js). Every change re-fetches and redraws the whole board,
// which is simpler than patching individual DOM elements.

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

  board.appendChild(renderAddListForm());
}

function renderAddListForm() {
  const form = document.createElement('form');
  form.className = 'add-list-form';
  form.onsubmit = handleAddList;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'New list';
  form.appendChild(input);

  const addButton = document.createElement('button');
  addButton.type = 'submit';
  addButton.textContent = 'Add list';
  form.appendChild(addButton);

  return form;
}

function renderColumn(list, cards) {
  const column = document.createElement('div');
  column.className = 'column';
  column.dataset.listId = list.id;

  // A column is a drop target. dragover must call preventDefault, or the
  // browser refuses to fire the drop event.
  column.ondragover = handleDragOver;
  column.ondragleave = handleDragLeave;
  column.ondrop = handleDrop;

  const header = document.createElement('div');
  header.className = 'column-header';

  const heading = document.createElement('h2');
  heading.textContent = list.name;
  header.appendChild(heading);

  const deleteListButton = document.createElement('button');
  deleteListButton.textContent = '✕';
  deleteListButton.title = 'Delete list';
  deleteListButton.dataset.listId = list.id;
  deleteListButton.dataset.listName = list.name;
  deleteListButton.onclick = handleDeleteList;
  header.appendChild(deleteListButton);

  column.appendChild(header);

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
  note.draggable = true;
  note.dataset.cardId = card.id;
  note.ondragstart = handleDragStart;

  // textContent (never innerHTML) so typed HTML shows literally and can't be injected.
  const text = document.createElement('span');
  text.className = 'card-text';
  text.textContent = card.text;
  text.title = 'Double-click to edit';
  text.dataset.cardId = card.id;
  text.ondblclick = handleEditCard;
  note.appendChild(text);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '✕';
  deleteButton.dataset.cardId = card.id;
  deleteButton.onclick = handleDeleteCard;
  note.appendChild(deleteButton);

  return note;
}

// ---------- Event handlers ----------

// STUDENT: write this handler. Send POST /cards/:list_id/:text,
// then reload the board.
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

// STUDENT: write this handler. Send DELETE /cards/:id, then reload the board.
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

// Send POST /lists/:name, then reload the board.
function handleAddList(event) {
  event.preventDefault();
  const input = event.target.querySelector('input');
  const name = encodeURIComponent(input.value);

  fetch(`/lists/${name}`, { method: 'POST' })
    .then(handleAddListResponse)
    .catch(showActionError);
}

function handleAddListResponse(response) {
  if (!response.ok) {
    alert(`Could not add list (status ${response.status})`);
    return;
  }
  loadBoard();
}

// Send DELETE /lists/:id, then reload the board. The server deletes the
// list's cards too, so confirm first.
function handleDeleteList(event) {
  const listId = event.target.dataset.listId;
  const listName = event.target.dataset.listName;

  if (!confirm(`Delete "${listName}" and all of its cards?`)) {
    return;
  }

  fetch(`/lists/${listId}`, { method: 'DELETE' })
    .then(handleDeleteListResponse)
    .catch(showActionError);
}

function handleDeleteListResponse(response) {
  if (!response.ok) {
    alert(`Could not delete list (status ${response.status})`);
    return;
  }
  loadBoard();
}

// Double-click a card's text to swap it for an input. Enter or clicking away
// saves; Escape cancels. Both Enter and Escape just call blur(), so the save
// logic lives in one place (handleEditBlur).
function handleEditCard(event) {
  const text = event.target;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'card-edit';
  input.value = text.textContent;
  input.dataset.cardId = text.dataset.cardId;
  input.dataset.originalText = text.textContent;
  input.onkeydown = handleEditKey;
  input.onblur = handleEditBlur;

  text.replaceWith(input);
  input.focus();
  input.select();
}

function handleEditKey(event) {
  if (event.key === 'Enter') {
    event.target.blur();
  } else if (event.key === 'Escape') {
    event.target.dataset.cancelled = 'true';
    event.target.blur();
  }
}

function handleEditBlur(event) {
  const input = event.target;
  const newText = input.value.trim();

  // Nothing to save: cancelled, blank, or unchanged. Redraw to restore the text.
  if (input.dataset.cancelled === 'true' || newText === '' || newText === input.dataset.originalText) {
    loadBoard();
    return;
  }

  // Same URL-encoding reason as handleAddCard.
  fetch(`/cards/${input.dataset.cardId}/${encodeURIComponent(newText)}`, { method: 'PUT' })
    .then(handleEditResponse)
    .catch(showActionError);
}

function handleEditResponse(response) {
  if (!response.ok) {
    alert(`Could not edit card (status ${response.status})`);
    loadBoard();
    return;
  }
  loadBoard();
}

// Drag and drop. The card id travels in dataTransfer from the drag start
// to the drop; the column's data-list-id says where it landed.
function handleDragStart(event) {
  event.dataTransfer.setData('text/plain', event.currentTarget.dataset.cardId);
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drop-target');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drop-target');
}

function handleDrop(event) {
  event.preventDefault();
  const column = event.currentTarget;
  column.classList.remove('drop-target');

  const cardId = event.dataTransfer.getData('text/plain');
  if (cardId === '') {
    return;
  }

  fetch(`/cards/${cardId}/list/${column.dataset.listId}`, { method: 'PUT' })
    .then(handleMoveResponse)
    .catch(showActionError);
}

function handleMoveResponse(response) {
  if (!response.ok) {
    alert(`Could not move card (status ${response.status})`);
    return;
  }
  loadBoard();
}

// Network-level failure (no response at all) for any of the actions above.
function showActionError() {
  alert("Couldn't reach the server. Is it running?");
}

loadBoard();
