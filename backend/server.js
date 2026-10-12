const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);

connectDB();

app.use(cors());
app.use(express.json());

// Load Models
require('./models/User');
require('./models/Conversation');
require('./models/Message');

// Routes
const energyRoutes = require('./routes/energyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/energy', energyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);

// Setup Socket.IO chat handlers
const setupChatSocket = require('./socket/chatSocket');
setupChatSocket(io);
app.set('isUserOnline', setupChatSocket.isUserOnline);

app.get('/', (req, res) => {
  res.json({
    message: 'Community Energy Sharing API is running with E2EE Chat & Socket.IO',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.IO enabled`);
});