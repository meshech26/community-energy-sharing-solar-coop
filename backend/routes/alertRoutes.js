const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes under /api/alerts with JWT auth
router.use(authMiddleware);

// Alert logs querying
router.get('/', alertController.getAlerts);
router.get('/unread-count', alertController.getUnreadCount);

// Status updates
router.patch('/read-all', alertController.markAllAsRead);
router.patch('/:id/read', alertController.markAsRead);
router.delete('/:id', alertController.deleteAlert);

module.exports = router;
