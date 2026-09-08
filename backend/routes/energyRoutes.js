const express = require('express');
const router = express.Router();
const energyController = require('../controllers/energyController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes under /api/energy with JWT auth
router.use(authMiddleware);

// Energy Readings and Aggregated Dashboard
router.get('/dashboard', energyController.getDashboard);
router.get('/generation', energyController.getGeneration);
router.get('/consumption', energyController.getConsumption);
router.get('/history', energyController.getHistory);

// Limits Configuration
router.get('/limit', energyController.getLimit);
router.post('/limit', energyController.saveLimit);
router.put('/limit', energyController.saveLimit);

// Energy Data Simulation Trigger
router.post('/simulate', energyController.simulateData);

module.exports = router;
