require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Clear existing users
    await User.deleteMany();
    console.log('Cleared existing users.');

    // Generate random household IDs
    const adminHouseholdId = new mongoose.Types.ObjectId();
    const userHouseholdId = new mongoose.Types.ObjectId();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create Admin
    const admin = await User.create({
      name: 'Coop Admin',
      email: 'admin@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: true,
      householdId: adminHouseholdId
    });

    // Create Member 1 (Kavindi Perera)
    const user = await User.create({
      name: 'Kavindi Perera',
      email: 'user@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: false,
      householdId: userHouseholdId
    });

    // Create Member 2 (Sunil Fernando)
    const member2HouseholdId = new mongoose.Types.ObjectId();
    const member2 = await User.create({
      name: 'Sunil Fernando',
      email: 'sunil@solarcoop.com',
      password: hashedPassword,
      isCoopAdmin: false,
      householdId: member2HouseholdId
    });

    console.log('Seed users created (Admin, Kavindi Perera, Sunil Fernando).');

    // Generate Tokens
    const generateToken = (user) => {
      return jwt.sign(
        { userId: user._id, householdId: user.householdId, isCoopAdmin: user.isCoopAdmin },
        process.env.JWT_SECRET || 'community_energy_secret_2026',
        { expiresIn: '30d' }
      );
    };

    const adminToken = generateToken(admin);
    const userToken = generateToken(user);

    console.log('\n--- ADMIN CREDENTIALS ---');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: password123`);
    console.log(`Token: Bearer ${adminToken}`);

    console.log('\n--- USER CREDENTIALS ---');
    console.log(`Email: ${user.email}`);
    console.log(`Password: password123`);
    console.log(`Token: Bearer ${userToken}`);
    console.log('\nUse these tokens in your Postman requests under Headers -> Authorization');

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
