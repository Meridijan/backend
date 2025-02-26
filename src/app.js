const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { createServer } = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: {origin: "*"} });

// Middleware
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const CHANNEL_ID = process.env.CHANNEL_ID;
const DISCORD_READER = process.env.DISCORD_READER;

if(!DISCORD_READER){
    console.error("Error: Discord bot token is missing! Add it to your .env file.");
    process.exit(1);
}

// Discord bot setup
const client = new Client({
    intents : [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Store messages in memory
let messagesCache = [];

//Event: Bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
})

//Event: When a new message is sent
client.on('messageCreate', (message) => {
    
    if(!message.guild || message.channel.id !== CHANNEL_ID) return;

    //FIXED: Declare `messageContent` properly before using it
    let messageContent = message.content && message.content.trim() !== "" ? message.content : "[Embedded Content]";

    const newMessage = {
        id: message.id,
        author: message.author.username,
        content: messageContent ? message.content : "[Embedded Content]",
        // embeds: message.embeds.length > 0 ? message.embeds.map(embed => ({
        //     title: embed.title || "No title",
        //     description: embed.description || "No description",
        //     image: embed.image ? embed.image.url : null
        // })) : null,
        attachments: message.attachments.size > 0 
            ? Array.from(message.attachments.values()).map(att => att.url) 
            : null,
        timestamp: message.createdAt,
    };

    //Store the message
    messagesCache.unshift(newMessage);

    // Keep only 50 messges from cache
    if(messagesCache.length > 50){
        messagesCache.pop();
    }

    // Emit the new message to all connected clients
    io.emit("newMessage", newMessage)
});

// API Route: Fetch new messages
app.get('/api/discord/messages', (req, res) => {
    res.json(messagesCache);
})

// API Route: Post a message from site to discord
app.post('/api/discord/post', async (req, res) => {
    try{
        const { content, username } =req.body;
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        const sentMessage = await channel.send(content);

        const newMessage = {
            id: sentMessage.id,
            author: username || "MeridijanTeam",
            content,
            avatar: "",
            attachments: null,
            timestamp: new Date(),
        };

        // messagesCache.unshift(newMessage);
        // io.emit("newMessage", newMessage);

        res.json({ success: true});
    }catch(error){
        console.error("Error posting message:", error);
        res.status(500).json({ error: "Failed to post message!"})
    }
})

client.login(DISCORD_READER);

app.get("/api/discord/webhook", (req, res) => {
  res.json({ webhookURL: process.env.REACT_APP_DISCORD_HOOK_URL})
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
