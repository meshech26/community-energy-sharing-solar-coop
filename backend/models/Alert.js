const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true, // Indexed to retrieve alert history quickly for a household
    },
    type: {
      type: String,
      required: true,
      enum: ['THRESHOLD_WARNING', 'HIGH_USAGE', 'LIMIT_EXCEEDED', 'UNUSUAL_CONSUMPTION'],
    },
    severity: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'critical'],
      default: 'warning',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    threshold: {
      type: Number, // Stores the value of the threshold that was breached (e.g. 240 kWh or 80%)
      required: true,
    },
    currentValue: {
      type: Number, // Stores the actual reading value that triggered the alert (e.g. 240.5 kWh)
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true, // Indexed to quickly filter unread alerts or fetch unread count
    },
  },
  {
    timestamps: true, // createdAt will represent when the alert was generated
  }
);

module.exports = mongoose.model('Alert', alertSchema);
