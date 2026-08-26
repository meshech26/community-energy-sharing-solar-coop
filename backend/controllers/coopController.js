const SustainabilityGoal = require("../models/SustainabilityGoal");

// POST /api/sustainability/coop/sync-average
exports.syncCoopAverage = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only an admin can trigger a co-op average sync." });
    }

    const goals = await SustainabilityGoal.find({});
    if (goals.length === 0) {
      return res.json({ message: "No goals exist yet.", coopAverageCo2Kg: 0 });
    }

    const totalCo2 = goals.reduce((sum, g) => sum + g.co2ToDateKg, 0);
    const average = Number((totalCo2 / goals.length).toFixed(2));

    await SustainabilityGoal.updateMany({}, { coopAverageCo2Kg: average });

    res.json({ message: "Co-op average synced", coopAverageCo2Kg: average, householdsCounted: goals.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/sustainability/coop/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const goals = await SustainabilityGoal.find({ leaderboardOptIn: true })
      .populate("user", "name")
      .sort({ co2ToDateKg: -1 })
      .limit(10);

    const leaderboard = goals.map((g, index) => ({
      rank: index + 1,
      name: g.user.name,
      co2ToDateKg: g.co2ToDateKg,
    }));

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};