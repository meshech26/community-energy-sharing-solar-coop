const SustainabilityGoal = require("../models/SustainabilityGoal");
const { generateAiInsight } = require("../utils/aiInsightGenerator");

exports.getPersonalizedInsight = async (req, res) => {
  try {
    const goal = await SustainabilityGoal.findOne({ user: req.user.id });
    if (!goal) return res.status(404).json({ message: "No goal set yet" });

    // Return the cached insight if one exists — avoids calling the API on every screen visit
    if (goal.aiInsight) {
      return res.json({ insight: goal.aiInsight, cached: true });
    }

    try {
      const insight = await generateAiInsight({
        progressHistory: goal.progressHistory,
        targetPercentReduction: goal.targetPercentReduction,
        co2ToDateKg: goal.co2ToDateKg,
      });
      if (!insight) throw new Error("Empty response from AI");

      goal.aiInsight = insight;
      goal.aiInsightGeneratedAt = new Date();
      await goal.save();
      res.json({ insight, cached: false });
    } catch (aiError) {
      console.error("AI insight generation failed:", aiError.message);
      res.json({
        insight: "Keep logging your usage to unlock a personalized insight soon.",
        fallback: true,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};