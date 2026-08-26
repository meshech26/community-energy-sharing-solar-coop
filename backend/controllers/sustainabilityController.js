const SustainabilityGoal = require("../models/SustainabilityGoal");
const { suggestTargetPercentReduction } = require("../utils/suggestionCalculator");

// GET /api/sustainability/goal/suggestion
exports.getSuggestedTarget = async (req, res) => {
  try {
    const goal = await SustainabilityGoal.findOne({ user: req.user.id });
    const suggestedTargetPercentReduction = suggestTargetPercentReduction(goal ? goal.progressHistory : []);
    res.json({ suggestedTargetPercentReduction });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/sustainability/goal/leaderboard-opt-in
exports.toggleLeaderboardOptIn = async (req, res) => {
  try {
    const { leaderboardOptIn } = req.body;
    if (typeof leaderboardOptIn !== "boolean") {
      return res.status(400).json({ message: "leaderboardOptIn must be true or false" });
    }
    const goal = await SustainabilityGoal.findOneAndUpdate(
      { user: req.user.id },
      { leaderboardOptIn },
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: "No goal found. Create one first." });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// CREATE — POST /api/sustainability/goal
exports.createGoal = async (req, res) => {
  try {
    const { targetPercentReduction, suggestedByApp } = req.body;

    if (typeof targetPercentReduction !== "number" || targetPercentReduction <= 0) {
      return res.status(400).json({ message: "targetPercentReduction must be a positive number" });
    }

    const existingGoal = await SustainabilityGoal.findOne({ user: req.user.id });
    if (existingGoal) {
      return res.status(409).json({ message: "A goal already exists for this user. Use PUT to update it." });
    }

    const goal = await SustainabilityGoal.create({
      user: req.user.id,
      targetPercentReduction,
      suggestedByApp: !!suggestedByApp,
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// READ — GET /api/sustainability/goal
exports.getGoal = async (req, res) => {
  try {
    const goal = await SustainabilityGoal.findOne({ user: req.user.id });
    if (!goal) return res.status(404).json({ message: "No goal set yet" });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE — PUT /api/sustainability/goal
exports.updateGoal = async (req, res) => {
  try {
    const { targetPercentReduction, suggestedByApp } = req.body;

    if (targetPercentReduction !== undefined &&
      (typeof targetPercentReduction !== "number" || targetPercentReduction <= 0)) {
      return res.status(400).json({ message: "targetPercentReduction must be a positive number" });
    }

    const updateFields = {};
    if (targetPercentReduction !== undefined) updateFields.targetPercentReduction = targetPercentReduction;
    if (suggestedByApp !== undefined) updateFields.suggestedByApp = !!suggestedByApp;

    const goal = await SustainabilityGoal.findOneAndUpdate(
      { user: req.user.id },
      updateFields,
      { new: true }
    );

    if (!goal) return res.status(404).json({ message: "No goal found to update. Create one first." });

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE — DELETE /api/sustainability/goal
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await SustainabilityGoal.findOneAndDelete({ user: req.user.id });
    if (!goal) return res.status(404).json({ message: "No goal found to delete" });
    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/sustainability/progress
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

// GET /api/sustainability/tip
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