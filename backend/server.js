const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const energyRoutes = require('./routes/energyRoutes');
const alertRoutes = require('./routes/alertRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Community Energy Sharing API is running',
  });
});

app.use('/api/energy', energyRoutes);
app.use('/api/alerts', alertRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});