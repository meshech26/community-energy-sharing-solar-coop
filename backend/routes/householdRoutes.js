const router = require('express').Router();
const requireAuth = require('../middleware/authMiddleware');
const requireCoopAdmin = require('../middleware/requireCoopAdmin');
const controller = require('../controllers/householdController');
router.use(requireAuth, requireCoopAdmin);
router.get('/', controller.list);
router.post('/', controller.create);
module.exports = router;
