const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;


// Example Route
app.get('/api/discord/messages', async (req, res) => {
  try{
    const response = await axios.get(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
      headers: {
        "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type" : "application/json",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching messages: ", error)
    res.status(500).json({ error: "Failed to fetch messages"})
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
