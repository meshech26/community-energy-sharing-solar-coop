const mongoose = require('mongoose');

const energyOrderSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EnergyListing',
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyerHouseholdId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerHouseholdId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    purchasedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: 'kWh',
    },
    agreedUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAYMENT_PROCESSING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentIntentId: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EnergyOrder', energyOrderSchema);
