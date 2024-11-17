require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { StreamChat } = require('stream-chat');
const knexConfig = require('./knex/knexfile');
const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allowed origins
    methods: ['GET', 'POST'],
    credentials: true, // Include credentials (if needed)
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Stream Chat SDK
const serverSideClient = new StreamChat(
  process.env.STREAM_API_KEY,
  process.env.STREAM_APP_SECRET
);

// Configure `socket.io` with CORS
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allowed origins
    methods: ['GET', 'POST'], // Allowed HTTP methods
    credentials: true, // Allow credentials (if needed)
  },
});

// API Endpoint to Join
app.post('/join', async (req, res) => {
  const { username } = req.body;

  try {
    const token = serverSideClient.createToken(username);

    // Add or update user in Stream
    await serverSideClient.updateUser({ id: username, name: username }, token);

    // Ensure General channel exists and add the user
    const admin = { id: 'admin' };
    const channel = serverSideClient.channel('team', 'general', {
      name: 'General',
      created_by: admin,
    });

    await channel.create();
    await channel.addMembers([username, 'admin']);

    res.status(200).json({
      user: { username },
      token,
      api_key: process.env.STREAM_API_KEY,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to join chat' });
  }
});

// Test Database Endpoint
app.get('/test-db', async (req, res) => {
  try {
    const result = await knex.raw('SELECT 1');
    res.status(200).json({ result: result[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for authentication
  socket.on('authenticate', ({ username }) => {
    socket.username = username; // Save username to the socket
    console.log(`${username} authenticated`);
  });

  // Listen for new messages
  socket.on('message.new', (data) => {
    console.log(`${socket.username}: ${data.text}`);

    // Broadcast the message to all connected clients
    io.emit('message.new', {
      user: { id: socket.username },
      text: data.text,
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`${socket.username || 'A user'} disconnected`);
  });
});

// Start the Server
server.listen(process.env.PORT || 5500, () => {
  console.log(`Server running on PORT ${process.env.PORT || 5500}`);
});
