require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const EnergyListing = require('../models/EnergyListing');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/community_energy');
    console.log('Connected to MongoDB.');

    // 1. Update Regular User to Kavindi Perera
    const result = await User.updateMany(
      { name: 'Regular User' },
      { $set: { name: 'Kavindi Perera' } }
    );
    console.log(`Updated ${result.modifiedCount} user(s) named "Regular User" to "Kavindi Perera".`);

    // Also check user@solarcoop.com
    const mainUser = await User.findOne({ email: 'user@solarcoop.com' });
    if (mainUser && mainUser.name !== 'Kavindi Perera') {
      mainUser.name = 'Kavindi Perera';
      await mainUser.save();
      console.log('Updated user@solarcoop.com name to Kavindi Perera.');
    }

    // 2. Ensure Member 2 (Sunil Fernando) exists
    let sunil = await User.findOne({ email: 'sunil@solarcoop.com' });
    if (!sunil) {
      sunil = await User.create({
        name: 'Sunil Fernando',
        email: 'sunil@solarcoop.com',
        password: '$2b$10$YourHashedPasswordHereOrWhatever',
        isCoopAdmin: false,
        householdId: new mongoose.Types.ObjectId()
      });
      console.log('Created member 2: Sunil Fernando');
    }

    // 3. Ensure Member 3 (Amal Silva) exists
    let amal = await User.findOne({ email: 'amal@solarcoop.com' });
    if (!amal) {
      amal = await User.create({
        name: 'Amal Silva',
        email: 'amal@solarcoop.com',
        password: '$2b$10$YourHashedPasswordHereOrWhatever',
        isCoopAdmin: false,
        householdId: new mongoose.Types.ObjectId()
      });
      console.log('Created member 3: Amal Silva');
    }

    // 4. Update orphaned listings (listings whose sellerId no longer exists in users) to belong to Sunil or Amal
    const allUsers = await User.find();
    
    const orphanedListings = await EnergyListing.find({
      sellerId: { $nin: allUsers.map(u => u._id) }
    });

    if (orphanedListings.length > 0) {
      console.log(`Found ${orphanedListings.length} orphaned listings. Reassigning to other members...`);
      for (let i = 0; i < orphanedListings.length; i++) {
        const listing = orphanedListings[i];
        listing.sellerId = i % 2 === 0 ? sunil._id : amal._id;
        listing.householdId = i % 2 === 0 ? sunil.householdId : amal.householdId;
        await listing.save();
      }
      console.log('Reassigned orphaned listings.');
    }

    // Also ensure Sunil has at least one active approved listing so Kavindi sees listings from other members
    const sunilListings = await EnergyListing.countDocuments({ sellerId: sunil._id, status: 'ACTIVE' });
    if (sunilListings === 0) {
      await EnergyListing.create({
        sellerId: sunil._id,
        householdId: sunil.householdId,
        pendingQuantity: 25,
        pendingUnit: 'kWh',
        pendingUnitPrice: 42,
        approvedQuantity: 25,
        approvedUnit: 'kWh',
        approvedUnitPrice: 42,
        status: 'ACTIVE',
        availableDate: new Date(),
        description: 'Clean rooftop solar generation available today.'
      });
      console.log('Created sample active listing for Sunil Fernando.');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
