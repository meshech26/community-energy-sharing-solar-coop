const mongoose = require('mongoose');

const energyReadingSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true, // Indexed for faster querying of a household's readings
    },
    solarGeneration: {
      type: Number,
      required: true, // Current solar power generation in kW
      min: [0, 'Solar generation cannot be negative'],
    },
    energyConsumption: {
      type: Number,
      required: true, // Current energy consumption in kW
      min: [0, 'Energy consumption cannot be negative'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true, // Indexed for faster time-based filtering and sorting (daily/weekly/monthly trends)
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('EnergyReading', energyReadingSchema);
