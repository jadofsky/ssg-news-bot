// bot.js
// ------------------------------------------------------
// SimSportsGaming Discord News Bot (Render-ready)
// - Uses discord.js v14 ("ready" event)
// - Serves /api/highlights with real avatars
// - CORS enabled for GitHub Pages
// - Caches and refreshes messages periodically
// ------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";

dotenv.config();

// -------- Express setup --------
const app = express();
const PORT = process.env.PORT || 3000;

// CORS: allow any origin to read the API (safe, read-only feed)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "OPTIONS"],
  })
);

// Simple health endpoint
app.get("/", (_req, res) => {
  res.type("text").send("SSG News bot is live");
});

// -------- Discord setup --------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;   // <- set in Render
const CHANNEL_ID   = process.env.CHANNEL_ID;       // <- set in Render

if (!DISCORD_TOKEN || !CHANNEL_ID) {
  console.error("❌ Missing DISCORD_TOKEN or CHANNEL_ID environment variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// In-memory cache of latest messages
let cachedMessages = [];

// Fetch latest messages from the channel and cache them
async function refreshCache(limit = 10) {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error("❌ Provided CHANNEL_ID is not a text channel or is inaccessible.");
      return;
    }

    const fetched = await channel.messages.fetch({ limit });
    // Keep newest first
    const list = Array.from(fetched.values()).sort(
      (a, b) => b.createdTimestamp - a.createdTimestamp
    );

    cachedMessages = list.map((msg) => ({
      author: msg.author.username,
      avatar: msg.author.displayAvatarURL({ size: 64 }),
      content: msg.content ?? "",
      timestamp: msg.createdAt.toISOString(),
    }));

    console.log(`🗂️  Cached ${cachedMessages.length} messages`);
  } catch (err) {
    console.error("❌ Error refreshing cache:", err);
  }
}

// Live update: prepend new messages from the target channel
client.on("messageCreate", (msg) => {
  if (msg.channelId !== CHANNEL_ID) return;

  const entry = {
    author: msg.author.username,
    avatar: msg.author.displayAvatarURL({ size: 64 }),
    content: msg.content ?? "",
    timestamp: msg.createdAt.toISOString(),
  };

  cachedMessages.unshift(entry);
  // Keep only the most recent 20 to cap memory
  if (cachedMessages.length > 20) cachedMessages.length = 20;
});

// Discord ready (v14)
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Initial load
  await refreshCache(10);
  // Refresh every 5 minutes
  setInterval(() => refreshCache(10), 5 * 60 * 1000);
});

// -------- API route --------
app.get("/api/highlights", (_req, res) => {
  res.json(cachedMessages);
});

// -------- Start server + Discord login --------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server running at http://localhost:${PORT}`);
});

client.login(DISCORD_TOKEN);
