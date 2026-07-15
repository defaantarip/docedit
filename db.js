// db.js

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

function defaultData() {
  return {
    users: [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
      { id: 'u3', name: 'Carol' }
    ],
    documents: [],
    shares: []
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = defaultData();
    save(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // Corrupt or empty file — recover instead of crashing the whole server.
    console.error('db.js: failed to parse db.json, reinitializing.', err.message);
    const initial = defaultData();
    save(initial);
    return initial;
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

let data = load();

function getData() {
  return data;
}

function persist() {
  if (testMode) return; 
  save(data);
}

// function persist() {
//   save(data);
// }

let testMode = false;

function resetForTests(customData) {
  testMode = true;
  data = customData || defaultData();
}

module.exports = { getData, persist, resetForTests, DB_PATH };


