const express = require('express');
const cors = require('cors');
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

const databaseReady = connectDB().then(async () => {
  await Notification.init();
  await AdminTransferRequest.init();
  await Household.init();
  startNotificationWorker();
}).catch((error) => { console.error('Notification startup failed:', error.message); process.exit(1); });

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin-transfers', require('./routes/adminTransferRoutes'));
app.use('/api/households', require('./routes/householdRoutes'));

app.get('/', (req, res) => {
  res.json({
    message: 'Community Energy Sharing API is running',
  });
});

const PORT = process.env.PORT || 5000;

databaseReady.then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
