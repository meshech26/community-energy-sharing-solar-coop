const SustainabilityGoal = require("../models/SustainabilityGoal");
const { calculateCo2OffsetKg } = require("../utils/co2Calculator");
const { calculateMonthOverMonthComparison } = require("../utils/comparisonCalculator");
const { calculateEarnedBadges } = require("../utils/badgeCalculator");

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const WEEKLY_TIPS = {
  default: [
    "Try shifting high-energy chores like laundry to midday to make more use of solar generation.",
    "Unplug devices on standby overnight — small leaks add up over a month.",
  ],
  highUsage: [
    "Your usage was higher than usual last month — check for appliances left running overnight.",
    "Consider checking your water heater or AC settings, they're common causes of usage spikes.",
  ],
  onTrack: [
    "You're ahead of your target — keep up the current routine and consider raising your goal next month.",
    "Great progress! Small consistent habits are clearly working for you.",
  ],
  behindTarget: [
    "You're a bit behind your target this month — try one small change, like reducing peak-hour usage.",
    "Consider setting a more gradual target if this one is feeling out of reach.",
  ],
};

function isFutureMonth(month) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return month > currentMonthStr;
}

// CREATE — POST /api/sustainability/progress
exports.logProgress = async (req, res) => {
  try {
    const { month, usageKwh } = req.body;

    if (!month || !MONTH_REGEX.test(month)) {
      return res.status(400).json({ message: "month must be in YYYY-MM format, e.g. '2026-08'" });
    }
    if (isFutureMonth(month)) {
      return res.status(400).json({ message: "Cannot log progress for a future month" });
    }
    if (typeof usageKwh !== "number" || usageKwh < 0) {
      return res.status(400).json({ message: "usageKwh must be a non-negative number" });
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
    goal.progressHistory.sort((a, b) => a.month.localeCompare(b.month));
    goal.co2ToDateKg += co2OffsetKg;

    const comparison = calculateMonthOverMonthComparison(goal.progressHistory, goal.targetPercentReduction);
    if (comparison.comparisonAvailable) {
      goal.currentStreakMonths = comparison.isAheadOfTarget ? goal.currentStreakMonths + 1 : 0;
      if (goal.currentStreakMonths > goal.longestStreakMonths) {
        goal.longestStreakMonths = goal.currentStreakMonths;
      }
    }

    await goal.save();

    const badges = calculateEarnedBadges(goal.currentStreakMonths, goal.co2ToDateKg);
    res.status(201).json({ goal, comparison, badges });
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
    const badges = calculateEarnedBadges(goal.currentStreakMonths, goal.co2ToDateKg);

    res.json({
      co2ToDateKg: goal.co2ToDateKg,
      treesEquivalent,
      progressHistory: goal.progressHistory,
      coopAverageCo2Kg: goal.coopAverageCo2Kg,
      currentStreakMonths: goal.currentStreakMonths,
      longestStreakMonths: goal.longestStreakMonths,
      badges,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// READ — GET /api/sustainability/progress/comparison
exports.getComparison = async (req, res) => {
  try {
    const goal = await SustainabilityGoal.findOne({ user: req.user.id });
    if (!goal) return res.status(404).json({ message: "No goal set yet" });

    const comparison = calculateMonthOverMonthComparison(goal.progressHistory, goal.targetPercentReduction);
    res.json(comparison);
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
    const comparison = calculateMonthOverMonthComparison(goal.progressHistory, goal.targetPercentReduction);

    let pool = WEEKLY_TIPS.default;
    if (lastEntry && lastEntry.usageKwh > 300) {
      pool = WEEKLY_TIPS.highUsage;
    } else if (comparison.comparisonAvailable) {
      pool = comparison.isAheadOfTarget ? WEEKLY_TIPS.onTrack : WEEKLY_TIPS.behindTarget;
    }

    const tip = pool[Math.floor(Math.random() * pool.length)];
    res.json({ tip });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE — DELETE /api/sustainability/progress/:month
exports.deleteProgressEntry = async (req, res) => {
  try {
    const { month } = req.params;
    const goal = await SustainabilityGoal.findOne({ user: req.user.id });
    if (!goal) return res.status(404).json({ message: "No goal found" });

    const entryIndex = goal.progressHistory.findIndex((entry) => entry.month === month);
    if (entryIndex === -1) {
      return res.status(404).json({ message: `No progress entry found for ${month}` });
    }

    goal.co2ToDateKg -= goal.progressHistory[entryIndex].co2OffsetKg;
    goal.progressHistory.splice(entryIndex, 1);
    await goal.save();

    res.json({ message: `Progress for ${month} deleted`, goal });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};