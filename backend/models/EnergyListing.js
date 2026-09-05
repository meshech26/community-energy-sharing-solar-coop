const mongoose = require('mongoose');

const energyListingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    approvedQuantity: {
      type: Number,
      default: 0,
    },
    approvedUnit: {
      type: String,
      default: 'kWh',
    },
    approvedUnitPrice: {
      type: Number,
      default: 0,
    },
    listedQuantity: {
      type: Number,
      default: 0,
    },
    availableQuantity: {
      type: Number,
      default: 0,
    },
    pendingQuantity: {
      type: Number,
      required: true,
    },
    pendingUnit: {
      type: String,
      default: 'kWh',
    },
    pendingUnitPrice: {
      type: Number,
      required: true,
    },
    availableDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'ACTIVE', 'PARTIALLY_SOLD', 'SOLD_OUT', 'DECLINED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING_APPROVAL',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    previousQuantity: {
      type: Number,
    },
    previousUnitPrice: {
      type: Number,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    declineReason: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EnergyListing', energyListingSchema);
