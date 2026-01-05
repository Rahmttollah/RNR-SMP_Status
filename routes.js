const { state, initStatusManager } = require("./statusManager");
const { startMinecraftMonitor } = require("./minecraft");
const { startDiscordBot } = require("./discord");
const express = require('express');
const path = require('path');
async function registerRoutes(app) {
  await initStatusManager();
  startMinecraftMonitor();
  startDiscordBot();
  app.get("/api/status", (req, res) => res.json(state));
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
}
module.exports = { registerRoutes };
