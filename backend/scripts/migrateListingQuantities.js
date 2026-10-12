require('dotenv').config();
const mongoose = require('mongoose');
const EnergyListing = require('../models/EnergyListing');
const EnergyOrder = require('../models/EnergyOrder');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const listings = await EnergyListing.find({});
    console.log(`Found ${listings.length} listings to check/migrate.`);

    for (const listing of listings) {
      // Find orders for this listing
      const orders = await EnergyOrder.find({
        listingId: listing._id,
        status: { $ne: 'CANCELLED' }
      });

      const totalPurchased = orders.reduce((sum, o) => sum + (Number(o.purchasedQuantity) || 0), 0);
      
      let listedQty = listing.listedQuantity;
      if (!listedQty || listedQty <= 0) {
        listedQty = Math.max(
          listing.pendingQuantity || 0,
          (listing.approvedQuantity || 0) + totalPurchased,
          totalPurchased
        );
        if (listedQty <= 0) {
          listedQty = listing.approvedQuantity > 0 ? listing.approvedQuantity : 10;
        }
      }

      let availableQty = 0;
      if (listing.status === 'SOLD_OUT' || listing.status === 'COMPLETED') {
        availableQty = 0;
      } else if (listing.status === 'PENDING_APPROVAL' || listing.status === 'DECLINED' || listing.status === 'CANCELLED') {
        availableQty = 0;
      } else {
        // ACTIVE or PARTIALLY_SOLD
        if (listing.approvedQuantity > 0) {
          availableQty = listing.approvedQuantity;
        } else {
          availableQty = Math.max(0, listedQty - totalPurchased);
        }
      }

      listing.listedQuantity = listedQty;
      listing.availableQuantity = availableQty;

      await listing.save();
      console.log(`Updated listing ${listing._id} (${listing.description || 'No desc'}): listed=${listedQty}, available=${availableQty}, status=${listing.status}`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
