const mongoose = require("mongoose");

const progressEntrySchema = new mongoose.Schema({
  month: { type: String, required: true }, // e.g. "2026-08"
  usageKwh: { type: Number, required: true },
  co2OffsetKg: { type: Number, required: true },
}, { _id: false });

const sustainabilityGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  targetPercentReduction: { type: Number, required: true }, // e.g. 15 (%)
  suggestedByApp: { type: Boolean, default: true },
  co2ToDateKg: { type: Number, default: 0 },
  progressHistory: [progressEntrySchema],
  coopAverageCo2Kg: { type: Number, default: 0 }, // synced periodically from co-op aggregate
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

sustainabilityGoalSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("SustainabilityGoal", sustainabilityGoalSchema);