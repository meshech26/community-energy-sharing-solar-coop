require('dotenv').config();
const mongoose = require('mongoose');
const EnergyListing = require('../models/EnergyListing');
const EnergyOrder = require('../models/EnergyOrder');
const User = require('../models/User');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for testing.');

    // 1. Get a seller and a buyer
    const seller = await User.findOne({ email: 'user@solarcoop.com' });
    const buyer = await User.findOne({ email: 'sunil@solarcoop.com' }) || seller;

    console.log(`Seller: ${seller.name} (${seller.email})`);
    console.log(`Buyer: ${buyer.name} (${buyer.email})`);

    // 2. Create a test listing
    const testListing = await EnergyListing.create({
      sellerId: seller._id,
      householdId: seller.householdId,
      pendingQuantity: 100,
      pendingUnit: 'kWh',
      pendingUnitPrice: 10,
      approvedQuantity: 0,
      approvedUnit: 'kWh',
      approvedUnitPrice: 0,
      listedQuantity: 100,
      availableQuantity: 0,
      availableDate: new Date(),
      description: 'Test Verification Solar Listing',
      status: 'PENDING_APPROVAL'
    });

    console.log('\n--- Step 1: Created Listing ---');
    console.log(`ID: ${testListing._id}`);
    console.log(`Status: ${testListing.status}`);
    console.log(`Listed Quantity: ${testListing.listedQuantity}`);
    console.log(`Available Quantity: ${testListing.availableQuantity}`);
    console.assert(testListing.listedQuantity === 100, 'Listed quantity should be 100');
    console.assert(testListing.availableQuantity === 0, 'Available quantity should be 0 before approval');

    // 3. Admin approves listing
    testListing.approvedQuantity = testListing.pendingQuantity;
    testListing.approvedUnit = testListing.pendingUnit;
    testListing.approvedUnitPrice = testListing.pendingUnitPrice;
    testListing.listedQuantity = testListing.pendingQuantity;
    testListing.availableQuantity = testListing.pendingQuantity;
    testListing.status = 'ACTIVE';
    testListing.approvedAt = new Date();
    await testListing.save();

    console.log('\n--- Step 2: Admin Approves Listing ---');
    console.log(`Status: ${testListing.status}`);
    console.log(`Listed Quantity: ${testListing.listedQuantity}`);
    console.log(`Available Quantity: ${testListing.availableQuantity}`);
    console.assert(testListing.listedQuantity === 100, 'Listed quantity should be 100');
    console.assert(testListing.availableQuantity === 100, 'Available quantity should be 100 after approval');

    // 4. Buyer purchases 30 kWh
    const buyQty1 = 30;
    const currentAvail1 = testListing.availableQuantity;
    const order1 = await EnergyOrder.create({
      listingId: testListing._id,
      buyerId: buyer._id,
      buyerHouseholdId: buyer.householdId,
      sellerId: testListing.sellerId,
      sellerHouseholdId: testListing.householdId,
      purchasedQuantity: buyQty1,
      unit: testListing.approvedUnit,
      agreedUnitPrice: testListing.approvedUnitPrice,
      totalAmount: buyQty1 * testListing.approvedUnitPrice,
      status: 'COMPLETED'
    });

    testListing.availableQuantity = Math.max(0, currentAvail1 - buyQty1);
    testListing.approvedQuantity = testListing.availableQuantity;
    if (testListing.availableQuantity <= 0) {
      testListing.status = 'SOLD_OUT';
    } else {
      testListing.status = 'ACTIVE';
    }
    await testListing.save();

    console.log('\n--- Step 3: User buys 30 kWh ---');
    console.log(`Order 1 ID: ${order1._id}, Qty: ${order1.purchasedQuantity} kWh`);
    console.log(`Listing Status: ${testListing.status}`);
    console.log(`Listed Quantity (MUST NOT CHANGE): ${testListing.listedQuantity}`);
    console.log(`Available Quantity (MUST BE 70): ${testListing.availableQuantity}`);
    console.assert(testListing.listedQuantity === 100, 'FAIL: Listed quantity changed!');
    console.assert(testListing.availableQuantity === 70, 'FAIL: Available quantity should be 70!');
    console.assert(testListing.status === 'ACTIVE', 'FAIL: Status should still be ACTIVE!');
    console.log('PASSED: Listed quantity stayed 100, Available quantity decreased to 70.');

    // 5. Buyer purchases remaining 70 kWh
    const buyQty2 = 70;
    const currentAvail2 = testListing.availableQuantity;
    const order2 = await EnergyOrder.create({
      listingId: testListing._id,
      buyerId: buyer._id,
      buyerHouseholdId: buyer.householdId,
      sellerId: testListing.sellerId,
      sellerHouseholdId: testListing.householdId,
      purchasedQuantity: buyQty2,
      unit: testListing.approvedUnit,
      agreedUnitPrice: testListing.approvedUnitPrice,
      totalAmount: buyQty2 * testListing.approvedUnitPrice,
      status: 'COMPLETED'
    });

    testListing.availableQuantity = Math.max(0, currentAvail2 - buyQty2);
    testListing.approvedQuantity = testListing.availableQuantity;
    if (testListing.availableQuantity <= 0) {
      testListing.status = 'SOLD_OUT';
    } else {
      testListing.status = 'ACTIVE';
    }
    await testListing.save();

    console.log('\n--- Step 4: User buys remaining 70 kWh ---');
    console.log(`Order 2 ID: ${order2._id}, Qty: ${order2.purchasedQuantity} kWh`);
    console.log(`Listing Status: ${testListing.status}`);
    console.log(`Listed Quantity (MUST STILL BE 100 IN HISTORY): ${testListing.listedQuantity}`);
    console.log(`Available Quantity (BECOMES 0): ${testListing.availableQuantity}`);
    console.assert(testListing.listedQuantity === 100, 'FAIL: Listed quantity changed!');
    console.assert(testListing.availableQuantity === 0, 'FAIL: Available quantity should be 0!');
    console.assert(testListing.status === 'SOLD_OUT', 'FAIL: Status should be SOLD_OUT!');
    console.log('PASSED: In history, Listed quantity is 100, Available quantity is 0, Status is SOLD_OUT.');

    // Clean up test records
    await EnergyOrder.deleteMany({ _id: { $in: [order1._id, order2._id] } });
    await EnergyListing.deleteOne({ _id: testListing._id });
    console.log('\nCleaned up test listing and orders.');
    console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
