// bot.js
// ------------------------------------------------------
// SimSportsGaming Discord News Bot
// Fetches messages from a specified channel and serves
// them as JSON to your website via an API endpoint.
// ------------------------------------------------------

import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Discord bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Global cache for messages
let cachedMessages = [];

// ✅ When the bot is ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  fetchMessages(); // Fetch on startup
  // Refresh every 5 minutes
  setInterval(fetchMessages, 5 * 60 * 1000);
});

// ✅ Function to fetch recent messages from your news channel
async function fetchMessages() {
  try {
    const channelId = process.env.DISCORD_CHANNEL_ID; // stored securely in Render
    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased()) {
      console.error("❌ Invalid or inaccessible channel.");
      return;
    }

    const messages = await channel.messages.fetch({ limit: 10 });

    cachedMessages = Array.from(messages.values()).map((msg) => ({
  author: msg.author.username,
  avatar: msg.author.displayAvatarURL({ size: 64 }),
  content: msg.content,
  timestamp: msg.createdAt,
}));


    console.log(`Cached ${cachedMessages.length} messages`);
  } catch (err) {
    console.error("Error fetching messages:", err);
  }
}

// ✅ API endpoint to serve highlights
app.get("/api/highlights", (req, res) => {
  res.json(cachedMessages);
});

// ✅ Start Express server
app.listen(PORT, () => {
  console.log(`🌐 Web server running at http://localhost:${PORT}`);
});

// ✅ Log in to Discord
client.login(process.env.DISCORD_BOT_TOKEN);
