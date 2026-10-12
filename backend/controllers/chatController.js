const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Helper to resolve preset user strings ('user-001', 'user-002', 'admin-001', or emails) into real MongoDB ObjectIds
async function resolveUserId(idOrEmail) {
  if (!idOrEmail) return null;
  const str = idOrEmail.toString();
  if (mongoose.Types.ObjectId.isValid(str) && str.length === 24) {
    return str;
  }
  let user = null;
  if (str === 'user-001' || str === 'normal') {
    user = await User.findOne({ email: 'user@solarcoop.com' });
  } else if (str === 'user-002' || str === 'member2') {
    user = await User.findOne({ email: 'sunil@solarcoop.com' });
  } else if (str === 'admin-001' || str === 'admin') {
    user = await User.findOne({ email: 'admin@solarcoop.com' });
  } else if (str.includes('@')) {
    user = await User.findOne({ email: str.toLowerCase().trim() });
  }
  return user ? user._id.toString() : str;
}

// Get current user profile (with real MongoDB _id and publicKey)
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id name email isCoopAdmin publicKey householdId');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email publicKey')
      .sort({ updatedAt: -1 });

    const formatted = conversations.map((conv) => {
      const recipient = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      const unreadCount = (conv.unreadCounts && conv.unreadCounts.get(userId.toString())) || 0;

      return {
        _id: conv._id,
        recipient: recipient || { _id: null, name: 'Unknown', publicKey: '' },
        lastMessage: conv.lastMessage,
        unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
};

// Find existing conversation or create a new one with a recipient
exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, error: 'Recipient ID is required' });
    }

    const resolvedRecipientId = await resolveUserId(recipientId);

    if (userId.toString() === resolvedRecipientId.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot create conversation with yourself' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, resolvedRecipientId], $size: 2 },
    }).populate('participants', 'name email publicKey');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, resolvedRecipientId],
        unreadCounts: {},
      });
      conversation = await conversation.populate('participants', 'name email publicKey');
    }

    const recipient = conversation.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    const unreadCount = (conversation.unreadCounts && conversation.unreadCounts.get(userId.toString())) || 0;

    res.json({
      success: true,
      data: {
        _id: conversation._id,
        recipient: recipient || { _id: resolvedRecipientId, name: 'User', publicKey: '' },
        lastMessage: conversation.lastMessage,
        unreadCount,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to access conversation' });
  }
};

// Send an encrypted message via REST API
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId, receiverId, ciphertext, nonce } = req.body;

    if (!conversationId || !receiverId || !ciphertext || !nonce) {
      return res.status(400).json({ success: false, error: 'Missing message parameters' });
    }

    const resolvedReceiverId = await resolveUserId(receiverId);

    const createdAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const isOnline = req.app.get('isUserOnline')?.(resolvedReceiverId) || false;
    const initialStatus = isOnline ? 'delivered' : 'sent';

    const message = await Message.create({
      conversationId,
      senderId,
      receiverId: resolvedReceiverId,
      ciphertext,
      nonce,
      status: initialStatus,
      read: false,
      createdAt,
      expiresAt,
    });

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.lastMessage = {
        ciphertext,
        nonce,
        senderId,
        createdAt,
      };
      if (!conversation.unreadCounts) {
        conversation.unreadCounts = new Map();
      }
      const prev = conversation.unreadCounts.get(resolvedReceiverId.toString()) || 0;
      conversation.unreadCounts.set(resolvedReceiverId.toString(), prev + 1);
      await conversation.save();
    }

    // Broadcast via socket.io if attached to app
    const io = req.app.get('io');
    if (io) {
      const messageData = {
        _id: message._id,
        conversationId,
        senderId,
        receiverId: resolvedReceiverId,
        ciphertext,
        nonce,
        status: initialStatus,
        read: false,
        createdAt: message.createdAt,
        expiresAt: message.expiresAt,
      };
      io.to(`user:${resolvedReceiverId}`).emit('new_message', { message: messageData, conversationId });
      io.to(`user:${receiverId}`).emit('new_message', { message: messageData, conversationId });
      io.to(`user:${senderId}`).emit('new_message', { message: messageData, conversationId });
      io.to(`user:${resolvedReceiverId}`).emit('unread_updated', { conversationId });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message via REST:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Get messages for a conversation - populates sender and receiver publicKeys
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email publicKey');

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Not authorized for this conversation' });
    }

    const recipient = conversation.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email publicKey')
      .populate('receiverId', 'name email publicKey')
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: messages,
      conversation: {
        _id: conversation._id,
        recipient: recipient || { _id: null, name: 'User', publicKey: '' },
        participants: conversation.participants,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

// Mark conversation messages as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    await Message.updateMany(
      { conversationId, receiverId: userId, status: { $ne: 'seen' } },
      { $set: { status: 'seen', read: true, seenAt: new Date() } }
    );

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      if (!conversation.unreadCounts) {
        conversation.unreadCounts = new Map();
      }
      conversation.unreadCounts.set(userId.toString(), 0);
      await conversation.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('messages_seen', {
        conversationId,
        seenBy: userId.toString(),
        seenAt: new Date(),
      });
      io.to(`user:${userId}`).emit('unread_updated', { conversationId });
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark messages as read' });
  }
};

// Get users list for "New Message" screen (displays only name)
exports.getUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    const query = { _id: { $ne: userId } };
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    // Only return _id, name, and publicKey (no role, household, or email shown in UI)
    const users = await User.find(query).select('name publicKey').sort({ name: 1 });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// Update user's public key
exports.updatePublicKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({ success: false, error: 'Public key is required' });
    }

    await User.findByIdAndUpdate(userId, { publicKey });
    res.json({ success: true, message: 'Public key updated' });
  } catch (error) {
    console.error('Error updating public key:', error);
    res.status(500).json({ success: false, error: 'Failed to update public key' });
  }
};

// Get total unread count across all conversations
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId });

    let totalUnread = 0;
    for (const conv of conversations) {
      if (conv.unreadCounts) {
        totalUnread += conv.unreadCounts.get(userId.toString()) || 0;
      }
    }

    res.json({ success: true, totalUnread });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, totalUnread: 0 });
  }
};
