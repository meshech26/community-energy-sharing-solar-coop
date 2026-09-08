const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Disable command buffering globally so queries fail fast if DB is offline
    mongoose.set('bufferCommands', false);

    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/community_solar_coop';
    
    // Attempt database connection with a 3-second timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB connected successfully');
    global.dbOffline = false;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.warn('\n================================================================');
    console.warn('⚠️  SERVER RUNNING IN IN-MEMORY MOCK DATABASE MODE (OFFLINE)');
    console.warn('   The application will run perfectly on localhost.');
    console.warn('   Pre-seeded historical data is loaded. No installation needed!');
    console.warn('================================================================\n');
    global.dbOffline = true;
  }
};

module.exports = connectDB;