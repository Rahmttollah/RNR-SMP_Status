const util = require("minecraft-server-util");
const axios = require("axios");
const { setStatus, setPlayers, setLatency, setTPS, setMotd } = require("./statusManager");
const settings = require("./settings");

const MC_HOST = settings.MC_FULL_IP;
const MC_PORT = settings.MC_PORT;
const CHECK_INTERVAL = 5000;

let failureCount = 0;

async function checkServer() {
  try {
    const result = await util.status(MC_HOST, MC_PORT, { timeout: 10000, enableSRV: true });
    failureCount = 0; // Reset on success
    
    const rawMotd = result.motd?.raw || "";
    setMotd(rawMotd);
    
    const motdLower = rawMotd.toLowerCase();
    
    if (motdLower.includes("position") || motdLower.includes("queue") || motdLower.includes("waiting") || motdLower.includes("starting")) {
      setStatus("queue");
    } else {
      setStatus("online");
    }

    setPlayers(
      result.players?.online || 0, 
      result.players?.max || 0, 
      result.players?.sample ? result.players.sample.map(p => ({ name: p.name })) : []
    );
    
    setLatency(result.roundTripLatency || null);
  } catch (err) {
    failureCount++;
    // Increased failure threshold to 5 (approx 25-30 seconds) to handle longer instability
    if (failureCount >= 5) {
      setStatus("offline");
      setMotd("§cServer Offline\n§7Please wait…");
    }
  }
}

function startMinecraftMonitor() {
  setInterval(checkServer, CHECK_INTERVAL);
  checkServer();
}

module.exports = { startMinecraftMonitor };