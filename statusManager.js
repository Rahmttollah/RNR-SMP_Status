const { storage } = require("./storage");
const { loadState, saveState } = require("./statePersistence");
const settings = require("./settings");

const state = {
  status: "offline", 
  host: settings.MC_FULL_IP, 
  port: settings.MC_PORT,
  players: { online: 0, max: 0, list: [] },
  latency: null, 
  tps: null, 
  motd: { raw: "", firstLine: "" },
  lastOnlineAt: null, 
  lastOfflineAt: null, 
  lastCrashAt: null,
  queue: { active: false, startedAt: null, expectedEndAt: null },
  lastOfflineAlertTime: null,
  offlineAlertCount: 0,
  lastOfflineReason: null,
  lastOnlineTime: null
};

const STATE_KEY = "status_manager_state";

async function initStatusManager() {
  // Try DB first
  const saved = await storage.getPersistentState(STATE_KEY);
  // Fallback to file for bot-specific fields if needed, but we'll consolidate
  const fileSaved = loadState();
  
  const combined = { ...saved, ...fileSaved };

  if (combined) {
    if (combined.lastOnlineAt) state.lastOnlineAt = combined.lastOnlineAt;
    if (combined.lastOfflineAt) state.lastOfflineAt = combined.lastOfflineAt;
    if (combined.lastCrashAt) state.lastCrashAt = combined.lastCrashAt;
    if (combined.queue) state.queue = combined.queue;
    if (combined.lastOfflineAlertTime) state.lastOfflineAlertTime = combined.lastOfflineAlertTime;
    if (combined.offlineAlertCount) state.offlineAlertCount = combined.offlineAlertCount;
    if (combined.lastOfflineReason) state.lastOfflineReason = combined.lastOfflineReason;
    if (combined.lastOnlineTime) state.lastOnlineTime = combined.lastOnlineTime;
    console.log("Restored state from persistence");
  }
}

async function persistState() {
  const data = {
    lastOnlineAt: state.lastOnlineAt,
    lastOfflineAt: state.lastOfflineAt,
    lastCrashAt: state.lastCrashAt,
    queue: state.queue,
    lastOfflineAlertTime: state.lastOfflineAlertTime,
    offlineAlertCount: state.offlineAlertCount,
    lastOfflineReason: state.lastOfflineReason,
    lastOnlineTime: state.lastOnlineTime
  };
  await storage.setPersistentState(STATE_KEY, data);
  saveState(data);
}

function setStatus(newStatus) {
  if (state.status === newStatus) return;

  // Only trigger "crash" if it was online and we've confirmed it's offline for a bit
  // But for now, let's just make it simpler to avoid false "crash" alerts
  const oldStatus = state.status;
  state.status = newStatus;

  if (newStatus === "online") {
    state.lastOnlineAt = Date.now();
    state.lastOnlineTime = Date.now();
    state.queue.active = false;
    state.queue.startedAt = null;
    state.queue.expectedEndAt = null;
    state.offlineAlertCount = 0;
    state.lastOfflineAlertTime = null;
  }

  if (newStatus === "offline") {
    state.lastOfflineAt = Date.now();
    state.lastOnlineAt = null;
    state.queue.active = false;
    state.queue.startedAt = null;
    state.queue.expectedEndAt = null;
    if (oldStatus !== "crash") state.lastOfflineReason = "Manual stop";
  }

  if (newStatus === "queue") {
    state.queue.active = true;
    if (!state.queue.startedAt) {
      state.queue.startedAt = Date.now();
      // Aternos queue varies, but we can set a rough estimate if we had one
      state.queue.expectedEndAt = Date.now() + (20 * 60 * 1000); 
    }
  }
  
  persistState();
}

function setPlayers(online, max, list = []) {
  state.players.online = online;
  state.players.max = max;
  state.players.list = list;
}

function setLatency(ms) {
  state.latency = ms;
}

function setTPS(tps) {
  state.tps = tps;
}

function setMotd(rawText = "") {
  state.motd.raw = rawText;
  const clean = rawText.replace(/\s{6,}/g, "\n");
  const lines = clean.split("\n");
  state.motd.firstLine = lines[0] || "";
}

function getUptime() {
  if (!state.lastOnlineTime) return "Offline";
  const diff = Date.now() - state.lastOnlineTime;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ${s % 60}s`;
}

function getQueueTime() {
  if (!state.queue.active || !state.queue.startedAt) return "N/A";
  const diff = Date.now() - state.queue.startedAt;
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

module.exports = {
  state,
  initStatusManager,
  setStatus,
  setPlayers,
  setLatency,
  setTPS,
  setMotd,
  getUptime,
  getQueueTime,
  persistState
};
