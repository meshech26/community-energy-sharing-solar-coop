const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createGoal, getGoal, updateGoal, deleteGoal,
  getSuggestedTarget, toggleLeaderboardOptIn,
} = require("../controllers/sustainabilityController");

const {
  logProgress, getProgress, getWeeklyTip, getComparison, deleteProgressEntry,
} = require("../controllers/progressController");

const { syncCoopAverage, getLeaderboard } = require("../controllers/coopController");

// Goal CRUD
router.post("/goal", auth, createGoal);
router.get("/goal", auth, getGoal);
router.put("/goal", auth, updateGoal);
router.delete("/goal", auth, deleteGoal);
router.get("/goal/suggestion", auth, getSuggestedTarget);
router.patch("/goal/leaderboard-opt-in", auth, toggleLeaderboardOptIn);

// Progress & CO2
router.post("/progress", auth, logProgress);
router.get("/progress", auth, getProgress);
router.get("/progress/comparison", auth, getComparison);
router.delete("/progress/:month", auth, deleteProgressEntry);
router.get("/tip", auth, getWeeklyTip);

// Co-op
router.post("/coop/sync-average", auth, syncCoopAverage);
router.get("/coop/leaderboard", auth, getLeaderboard);

module.exports = router;