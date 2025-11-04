// bot.js
// ---------------------------------------------
// SSG News Bot - Discord + Express API
// Fetches latest channel messages and serves
// them via /api/highlights for your website
// ---------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";

dotenv.config();

// --- Setup Express ---
const app = express();
const port = process.env.PORT || 3000;

// ✅ Allow all domains to fetch the highlights feed
app.use(cors());

// --- Setup Discord Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const channelId = process.env.CHANNEL_ID;
let cachedMessages = [];

// --- When Bot is Ready ---
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await cacheMessages();
});

// --- Function to Fetch Latest Messages ---
async function cacheMessages() {
  try {
    const channel = await client.channels.fetch(channelId);
    const messages = await channel.messages.fetch({ limit: 10 });
    cachedMessages = Array.from(messages.values()).map((msg) => ({
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.createdAt,
    }));
    console.log(`Cached ${cachedMessages.length} messages`);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
  }
}

// --- API Endpoint ---
app.get("/api/highlights", (req, res) => {
  res.json(cachedMessages);
});

// --- Start Express Server ---
app.listen(port, () => {
  console.log(`🌐 Web server running at http://localhost:${port}`);
});

// --- Log into Discord ---
client.login(process.env.DISCORD_TOKEN);
