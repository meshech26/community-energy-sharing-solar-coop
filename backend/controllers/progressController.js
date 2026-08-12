const SustainabilityGoal = require("../models/SustainabilityGoal");
const { calculateCo2OffsetKg } = require("../utils/co2Calculator");

// CREATE — POST /api/sustainability/progress
exports.logProgress = async (req, res) => {
  try {
    const { month, usageKwh } = req.body;

    if (!month || typeof usageKwh !== "number" || usageKwh < 0) {
      return res.status(400).json({ message: "month (e.g. '2026-08') and a non-negative usageKwh are required" });
    }

    const goal = await SustainabilityGoal.findOne({ user: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: "No goal found. Create a goal before logging progress." });
    }

    const alreadyLogged = goal.progressHistory.find((entry) => entry.month === month);
    if (alreadyLogged) {
      return res.status(409).json({ message: `Progress for ${month} has already been logged.` });
    }

    const co2OffsetKg = calculateCo2OffsetKg(usageKwh);

    goal.progressHistory.push({ month, usageKwh, co2OffsetKg });
    goal.co2ToDateKg += co2OffsetKg;
    await goal.save();

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// READ — GET /api/sustainability/progress
exports.getProgress = async (req, res) => {
  try {
    const goal = await SustainabilityGoal.findOne({ user: req.user.id });
    if (!goal) return res.status(404).json({ message: "No goal set yet" });

    const treesEquivalent = (goal.co2ToDateKg / 21).toFixed(1);

    res.json({
      co2ToDateKg: goal.co2ToDateKg,
      treesEquivalent,
      progressHistory: goal.progressHistory,
      coopAverageCo2Kg: goal.coopAverageCo2Kg,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// READ — GET /api/sustainability/tip
exports.getWeeklyTip = async (req, res) => {
  try {
    const goal = await SustainabilityGoal.findOne({ user: req.user.id });
    if (!goal) return res.status(404).json({ message: "No goal set yet" });

    const lastEntry = goal.progressHistory[goal.progressHistory.length - 1];
    let tip = "Try shifting high-energy chores to midday to make more use of solar generation.";
    if (lastEntry && lastEntry.usageKwh > 300) {
      tip = "Your usage was higher than usual last month — check for appliances left running overnight.";
    }
    res.json({ tip });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};