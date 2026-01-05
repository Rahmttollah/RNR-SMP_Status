const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const { state, getQueueTime, getUptime, persistState } = require("./statusManager");
const settings = require("./settings");
const { QUEUE_MOCK_MESSAGES } = require("./mockMessages");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || "1454791933280129216";

const ADMIN_ID = settings.ADMIN_ID;
const ADMIN_TAG = `<@${ADMIN_ID}>`;

let menuMessage = null;
let lastState = null;
let alertBatchTimeout = null;
let offlineMessages = [];

// Bengali funny offline messages
const BENGALI_FUNNY_MESSAGES = [
  "Oi! Server ghumaitche! Utha tora! 😴",
  "Server offline, admin mama ekhon cha khaitche. ☕",
  "Minecraft er bhoot server ta bondho kore diyeche! 👻",
  "Server er petrol sesh hoye geche, keu ektu dhakka dao! 🚗",
  "Abar server offline? Admin ke dhoro, or thika penalty nawa hobe! 👊",
  "Server ta ekhon rest nicche, player der jonno dorkar ache. 🛌"
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ================= BOT READY ================= */

client.once("clientReady", async () => {
  console.log(`🤖 Bot Online: ${client.user?.tag}`);

  const commands = [
    new SlashCommandBuilder().setName("server").setDescription("Check Minecraft server status"),
    new SlashCommandBuilder().setName("status").setDescription("Get current infrastructure status")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error(err);
  }

  await syncBotWithCurrentServerState();
  setInterval(handleStateChange, 5000);
});

/* ================= INTERACTIONS ================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "server" || interaction.commandName === "status") {
    await interaction.reply({
      embeds: [createStatusEmbed()],
      ephemeral: true
    });
  }
});

/* ================= EMBED ================= */

function createStatusEmbed() {
  const statusColor =
    state.status === "online"
      ? 0x00ff88
      : state.status === "queue"
      ? 0xffaa00
      : 0xff5555;

  const iconURL = "https://i.supaimg.com/04802807-5d29-4223-9632-bcbc23a3c841.png";

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "RNR-SMP STATUS",
      iconURL: iconURL
    })
    .setThumbnail(iconURL)
    .setColor(statusColor)
    .addFields(
      { name: "Status", value: state.status.toUpperCase(), inline: true },
      { name: "Players", value: `${state.players.online}/${state.players.max}`, inline: true },
      { name: "Ping", value: state.latency ? `${state.latency}ms` : "N/A", inline: true },
      { name: "Java IP", value: `\`${settings.MC_FULL_IP}\`` },
      { name: "Bedrock IP", value: `\`${settings.MC_FULL_IP}:${settings.MC_PORT}\`` },
      { name: "Uptime", value: getUptime() }
    )
    .setTimestamp();

  if (state.status === "queue") {
    embed.addFields({ name: "Queue Time", value: getQueueTime() });
  }

  return embed;
}

/* ================= STATE HANDLING ================= */

async function syncBotWithCurrentServerState() {
  lastState = state.status;
  if (state.status === "online") return updateOnlineMenu();
  if (state.status === "queue") return updateQueueMenu();
  return updateOfflineMenu();
}

async function handleStateChange() {
  if (state.status === "queue") await handleQueueWarnings();

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;

  // Case: State is same -> Just update the live menu message
  if (state.status === lastState) {
    const embed = createStatusEmbed();
    if (menuMessage) {
      try {
        await menuMessage.edit({ embeds: [embed] });
      } catch (e) {
        menuMessage = null;
      }
    }
    return;
  }

  // Case: State changed!
  const oldState = lastState;
  lastState = state.status;

  // 1. Delete the old "Menu" message to keep it at the bottom
  if (menuMessage) {
    try {
      await menuMessage.delete();
    } catch (e) {}
    menuMessage = null;
  }

  // 2. Send status change announcement
  const embed = createStatusEmbed();
  embed.setAuthor({
    name: `Status Change: ${oldState.toUpperCase()} → ${state.status.toUpperCase()}`,
    iconURL: `https://api.mcsrvstat.us/icon/${settings.MC_FULL_IP}:${settings.MC_PORT}`
  });

  const msg = await channel.send({
    content: state.status !== "online" ? ADMIN_TAG : null,
    embeds: [embed]
  });

  if (state.status !== "online") offlineMessages.push(msg);

  // 3. Clean up or Start watchdog
  if (state.status === "online") {
    await cleanupOfflineMessages();
    await updateOnlineMenu();
  } else if (state.status === "queue") {
    await cleanupOfflineMessages(); // Delete offline alerts when entering queue
    await updateQueueMenu();
  } else {
    await updateOfflineMenu();
    startOfflineWatchdog();
  }
}

/* ================= QUEUE WARNINGS ================= */

async function handleQueueWarnings() {
  if (!state.queue?.startedAt) return;
}

/* ================= MENUS ================= */

async function updateOnlineMenu() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("🌐 Open Website")
      .setStyle(ButtonStyle.Link)
      .setURL(settings.WEBSITE_URL)
  );

  await sendOrEditMenu(channel, createStatusEmbed(), row);
}

async function updateQueueMenu() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  await sendOrEditMenu(channel, createStatusEmbed(), null);
}

async function updateOfflineMenu() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;
  await sendOrEditMenu(channel, createStatusEmbed(), null);
}

async function sendOrEditMenu(channel, embed, row) {
  try {
    if (menuMessage) {
      await menuMessage.edit({ embeds: [embed], components: row ? [row] : [] });
    } else {
      menuMessage = await channel.send({
        embeds: [embed],
        components: row ? [row] : []
      });
    }
  } catch (e) {
    menuMessage = null;
  }
}

/* ================= OFFLINE WATCHDOG ================= */

async function cleanupOfflineMessages() {
  for (const msg of offlineMessages) {
    try { await msg.delete(); } catch {}
  }
  offlineMessages = [];
}

function startOfflineWatchdog() {
  if (alertBatchTimeout) clearTimeout(alertBatchTimeout);
  
  if (!state.offlineAlertCount) state.offlineAlertCount = 0;
  if (!state.lastOfflineAlertTime) state.lastOfflineAlertTime = 0;
  
  alertBatchTimeout = setTimeout(sendOfflineLoopAlert, 10 * 60 * 1000); 
}

async function sendOfflineLoopAlert() {
  if (state.status !== "offline") return;

  const now = Date.now();
  const threeHoursMs = 3 * 60 * 60 * 1000;
  
  if (now - state.lastOfflineAlertTime > threeHoursMs) {
      state.offlineAlertCount = 0;
  }

  if (state.offlineAlertCount < 6) {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      const randomMsg = BENGALI_FUNNY_MESSAGES[Math.floor(Math.random() * BENGALI_FUNNY_MESSAGES.length)];
      
      const embed = new EmbedBuilder()
        .setAuthor({
          name: "OFFLINE ALARM",
          iconURL: `https://api.mcsrvstat.us/icon/${settings.MC_FULL_IP}:${settings.MC_PORT}`
        })
        .setDescription(`${randomMsg}\n\n🟥 Server is offline! Tagging admins...`)
        .setColor(0xff0000)
        .setTimestamp();

      const msg = await channel.send({ content: ADMIN_TAG, embeds: [embed] });
      offlineMessages.push(msg);
      
      state.offlineAlertCount++;
      state.lastOfflineAlertTime = now;
      persistState();
    }
  }

  alertBatchTimeout = setTimeout(sendOfflineLoopAlert, 10 * 60 * 1000);
}

/* ================= START ================= */

function startDiscordBot() {
  if (!DISCORD_TOKEN) return;
  client.login(DISCORD_TOKEN).catch(console.error);
}

module.exports = { startDiscordBot };