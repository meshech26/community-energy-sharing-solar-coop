const router = require('express').Router();
const requireAuth = require('../middleware/authMiddleware');
const { listNotifications, readNotification } = require('../controllers/notificationController');

router.use(requireAuth);
router.get('/', listNotifications);
router.patch('/:id/read', readNotification);
module.exports = router;
