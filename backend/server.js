const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const Notification = require('./models/Notification');
const AdminTransferRequest = require('./models/AdminTransferRequest');
const Household = require('./models/Household');
const { startNotificationWorker } = require('./services/notificationService');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required to start the API.');
  process.exit(1);
}

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

const databaseReady = connectDB()
  .then(async () => {
    await Notification.init();
    await AdminTransferRequest.init();
    await Household.init();
    startNotificationWorker();
  })
  .catch((error) => {
    console.error('Notification startup failed:', error.message);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());

// Load Models
require('./models/User');
require('./models/Conversation');
require('./models/Message');

// Express Routes
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin-transfers', require('./routes/adminTransferRoutes'));
app.use('/api/households', require('./routes/householdRoutes'));

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

databaseReady.then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.IO enabled`);
  });
});
