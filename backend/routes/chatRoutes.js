const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/me', chatController.getMyProfile);
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.getOrCreateConversation);
router.post('/messages', chatController.sendMessage);
router.get('/messages/:conversationId', chatController.getMessages);
router.post('/messages/read/:conversationId', chatController.markAsRead);
router.get('/users', chatController.getUsers);
router.put('/public-key', chatController.updatePublicKey);
router.get('/unread-count', chatController.getUnreadCount);

module.exports = router;
