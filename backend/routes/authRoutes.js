const express = require('express');

const { getCurrentUser, login, register } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');
const account = require('../controllers/accountController');
const limit = require('../middleware/accountRateLimit');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getCurrentUser);
router.get('/account', requireAuth, account.profile);
router.post('/forgot-password', limit, account.forgot);
router.post('/reset-password', limit, account.reset);
router.post('/change-password', requireAuth, limit, account.change);

module.exports = router;
