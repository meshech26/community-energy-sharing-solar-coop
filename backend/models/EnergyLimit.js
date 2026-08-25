const mongoose = require('mongoose');

const energyLimitSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true, // Each household has exactly one limit configuration
      index: true,
    },
    monthlyLimit: {
      type: Number,
      required: [true, 'Monthly limit is required'],
      min: [0.01, 'Monthly limit must be greater than 0'],
    },
    warningPercentage: {
      type: Number,
      default: 80, // Default to warning the user at 80% usage
      min: [1, 'Warning percentage must be at least 1%'],
      max: [100, 'Warning percentage cannot exceed 100%'],
    },
  },
  {
    timestamps: true, // Includes updatedAt, which will represent when the limit was last updated
  }
);

module.exports = mongoose.model('EnergyLimit', energyLimitSchema);
