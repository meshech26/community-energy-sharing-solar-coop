const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createGoal, getGoal, updateGoal, deleteGoal, getProgress, getWeeklyTip,
} = require("../controllers/sustainabilityController");

router.post("/goal", auth, createGoal);
router.get("/goal", auth, getGoal);
router.put("/goal", auth, updateGoal);
router.delete("/goal", auth, deleteGoal);

router.get("/progress", auth, getProgress);
router.get("/tip", auth, getWeeklyTip);

module.exports = router;