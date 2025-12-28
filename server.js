const express = require('express');
const util = require('minecraft-server-util');
const path = require('path');

const app = express();

/* ===== ENV SAFE CONFIG ===== */
const HOST = process.env.MC_HOST || 'RNR-SMP.minecraft.pe';
const PORT_MC = Number(process.env.MC_PORT) || 29622;
const WEB_PORT = process.env.PORT || 10303;

/* ===== STATIC FILES ===== */
app.use(express.static(path.join(__dirname, 'public')));

/* ===== CACHE + STATE ===== */
let cachedStatus = null;
let lastFetch = 0;
let lastOnlineTime = null;
let lastOfflineTime = null;

function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
}

/* ===== API ===== */
app.get('/api/status', async (req, res) => {

    /* cache (5s) */
    if (cachedStatus && Date.now() - lastFetch < 1000) {
        return res.json(cachedStatus);
    }

    try {
        const result = await util.status(HOST, PORT_MC, { timeout: 2000 });

        /* ONLINE */
        if (!lastOnlineTime) lastOnlineTime = Date.now();
        lastOfflineTime = null;

        const rawMotd = result.motd?.raw || '';
        const cleanMotd = rawMotd.replace(/\s{6,}/g, '\n');
        const motdLines = cleanMotd.split('\n').slice(0, 2);

        cachedStatus = {
            online: true,
            latency: result.roundTripLatency,
            players: {
                online: result.players.online,
                max: result.players.max,
                list: result.players.sample || []
            },
            motd: motdLines,
            version: result.version.name,
            uptime: formatUptime(Date.now() - lastOnlineTime)
        };

    } catch (err) {
        /* OFFLINE / STARTING / RESTARTING */
        if (!lastOfflineTime) lastOfflineTime = Date.now();
        lastOnlineTime = null;

        cachedStatus = {
            online: false,
            status: lastFetch === 0 ? 'STARTING' : 'RESTARTING',
            offlineFor: formatUptime(Date.now() - lastOfflineTime)
        };
    }

    lastFetch = Date.now();
    res.json(cachedStatus);
});

/* ===== START SERVER ===== */
app.listen(WEB_PORT, () => {
    console.log(`✅ Web server running on port ${WEB_PORT}`);
    console.log(`🎮 MC Server: ${HOST}:${PORT_MC}`);
});
