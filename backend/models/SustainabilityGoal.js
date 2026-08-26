const mongoose = require("mongoose");

const progressEntrySchema = new mongoose.Schema({
  month: { type: String, required: true },
  usageKwh: { type: Number, required: true },
  co2OffsetKg: { type: Number, required: true },
}, { _id: false });

const sustainabilityGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  targetPercentReduction: { type: Number, required: true },
  suggestedByApp: { type: Boolean, default: true },
  co2ToDateKg: { type: Number, default: 0 },
  progressHistory: [progressEntrySchema],
  coopAverageCo2Kg: { type: Number, default: 0 },
  currentStreakMonths: { type: Number, default: 0 },
  longestStreakMonths: { type: Number, default: 0 },
  leaderboardOptIn: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

sustainabilityGoalSchema.pre("save", function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("SustainabilityGoal", sustainabilityGoalSchema);