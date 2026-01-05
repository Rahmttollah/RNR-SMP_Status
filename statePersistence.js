const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'persistent_state.json');

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {
      console.error('Error loading persistent state:', e);
    }
  }
  return {};
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Error saving persistent state:', e);
  }
}

module.exports = { loadState, saveState };
