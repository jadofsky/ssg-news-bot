// bot.js
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const CHANNEL_ID = '1004603096078487642'; // your SSG Baseball News channel

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let messagesCache = [];

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const fetched = await channel.messages.fetch({ limit: 10 });
    messagesCache = fetched.map(msg => ({
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.createdAt
    }));
    console.log(`Cached ${messagesCache.length} messages`);
  } catch (err) {
    console.error('Error fetching channel:', err);
  }
});

client.on('messageCreate', (msg) => {
  if (msg.channel.id === CHANNEL_ID) {
    messagesCache.unshift({
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.createdAt
    });
    messagesCache = messagesCache.slice(0, 20);
  }
});

app.get('/api/highlights', (req, res) => {
  res.json(messagesCache);
});

app.listen(PORT, () =>
  console.log(`🌐 Web server running at http://localhost:${PORT}`)
);

client.login(process.env.DISCORD_TOKEN);
