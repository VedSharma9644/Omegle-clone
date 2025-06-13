const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();

// Configure CORS for Express
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.static(path.join(__dirname, 'client/build')));

// Add catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const server = http.createServer(app);

// Configure Socket.IO with more permissive CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Queues for different chat modes
const queues = {
  text: [],
  voice: [],
  video: []
};

// Online user count
let onlineUsers = 0;

// Track active pairs for text chat
const textPairs = {};

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  onlineUsers++;
  io.emit('userCount', onlineUsers);

  // Handle joining different chat modes
  socket.on('joinQueue', (mode) => {
    console.log(`User ${socket.id} joined ${mode} queue`);
    if (!queues[mode]) return;

    // Remove from other queues
    Object.keys(queues).forEach(m => {
      queues[m] = queues[m].filter(id => id !== socket.id);
    });

    // Add to selected queue
    queues[mode].push(socket.id);
    console.log(`Current ${mode} queue:`, queues[mode]);

    // Check for match
    if (queues[mode].length >= 2) {
      const user1 = queues[mode].shift();
      const user2 = queues[mode].shift();

      // Randomly choose initiator
      const initiator = Math.random() < 0.5 ? user1 : user2;
      const receiver = initiator === user1 ? user2 : user1;

      // Track text chat pairs
      if (mode === 'text') {
        textPairs[user1] = user2;
        textPairs[user2] = user1;
      }

      console.log(`Matching users: ${initiator} and ${receiver}`);
      // Notify both users of match and roles
      io.to(initiator).emit('match', { mode, partnerId: receiver, initiator: true });
      io.to(receiver).emit('match', { mode, partnerId: initiator, initiator: false });
    }
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ to, signal }) => {
    console.log(`Signal from ${socket.id} to ${to}:`, signal.type);
    io.to(to).emit('signal', { from: socket.id, signal });
  });

  // Handle text messages
  socket.on('message', ({ to, message }) => {
    io.to(to).emit('message', { from: socket.id, message });
  });

  // Handle leaving text chat
  socket.on('leaveChat', () => {
    console.log('User left text chat:', socket.id);
    // Remove from text queue
    queues.text = queues.text.filter(id => id !== socket.id);
    // Notify text chat partner only
    const partnerId = textPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('partnerDisconnected');
      delete textPairs[partnerId];
      delete textPairs[socket.id];
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    onlineUsers--;
    io.emit('userCount', onlineUsers);

    // Remove from all queues
    Object.keys(queues).forEach(mode => {
      queues[mode] = queues[mode].filter(id => id !== socket.id);
    });

    // Notify text chat partner only
    const partnerId = textPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('partnerDisconnected');
      delete textPairs[partnerId];
      delete textPairs[socket.id];
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 