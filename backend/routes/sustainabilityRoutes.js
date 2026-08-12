const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createGoal, getGoal, updateGoal, deleteGoal,
} = require("../controllers/sustainabilityController");

const {
  logProgress, getProgress, getWeeklyTip,
} = require("../controllers/progressController");

// Goal CRUD
router.post("/goal", auth, createGoal);
router.get("/goal", auth, getGoal);
router.put("/goal", auth, updateGoal);
router.delete("/goal", auth, deleteGoal);

// Progress & CO2 tracking
router.post("/progress", auth, logProgress);
router.get("/progress", auth, getProgress);
router.get("/tip", auth, getWeeklyTip);

module.exports = router;