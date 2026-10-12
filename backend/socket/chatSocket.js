const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

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

// Map of userId -> Set of socket IDs
const userSockets = new Map();

function isUserOnline(userId) {
  if (!userId) return false;
  const str = userId.toString();
  return userSockets.has(str) && userSockets.get(str).size > 0;
}

const setupChatSocket = (io) => {
  io.on('connection', (socket) => {
    let currentUserId = null;
    let rawUserId = null;

    // User joins with their userId (e.g. MongoDB _id or preset string)
    socket.on('join', async ({ userId }) => {
      if (!userId) return;

      const rawId = userId.toString();
      const realId = await resolveUserId(rawId);
      currentUserId = realId || rawId;
      rawUserId = rawId;

      socket.join(`user:${currentUserId}`);
      if (rawId !== currentUserId) {
        socket.join(`user:${rawId}`);
      }

      if (!userSockets.has(currentUserId)) {
        userSockets.set(currentUserId, new Set());
      }
      userSockets.get(currentUserId).add(socket.id);

      if (rawId && rawId !== currentUserId) {
        if (!userSockets.has(rawId)) {
          userSockets.set(rawId, new Set());
        }
        userSockets.get(rawId).add(socket.id);
      }

      // When user comes online, mark undelivered messages as 'delivered'
      try {
        const validIds = [currentUserId, rawId].filter(
          (id) => id && mongoose.Types.ObjectId.isValid(id) && id.toString().length === 24
        );
        if (validIds.length > 0) {
          await Message.updateMany(
            { receiverId: { $in: validIds }, status: 'sent' },
            { $set: { status: 'delivered' } }
          );
        }
        io.emit('messages_delivered', { receiverId: currentUserId });
      } catch (err) {
        console.error('Error updating delivered status:', err);
      }

      // Broadcast online status to all
      io.emit('user_online', { userId: currentUserId, rawUserId: rawId });

      // Send the newly joined user the list of all currently online users
      const onlineUserIds = Array.from(userSockets.keys());
      socket.emit('online_users', { userIds: onlineUserIds });
    });

    // Real-time encrypted message sending with delivery tracking
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, senderId, receiverId, ciphertext, nonce } = data;

        if (!conversationId || !senderId || !receiverId || !ciphertext || !nonce) {
          if (typeof callback === 'function') callback({ success: false, error: 'Invalid message data' });
          return;
        }

        const resolvedSenderId = await resolveUserId(senderId);
        const resolvedReceiverId = await resolveUserId(receiverId);

        // Check if recipient is online:
        // YES -> status: 'delivered' (✓✓)
        // NO  -> status: 'sent' (✓)
        const recipientIsOnline = isUserOnline(resolvedReceiverId) || isUserOnline(receiverId);
        const initialStatus = recipientIsOnline ? 'delivered' : 'sent';

        // 7-day automatic deletion timestamp
        const createdAt = new Date();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Save encrypted message to MongoDB
        const message = await Message.create({
          conversationId,
          senderId: resolvedSenderId,
          receiverId: resolvedReceiverId,
          ciphertext,
          nonce,
          status: initialStatus,
          read: false,
          createdAt,
          expiresAt,
        });

        // Update conversation lastMessage and unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = {
            ciphertext,
            nonce,
            senderId: resolvedSenderId,
            createdAt,
          };
          if (!conversation.unreadCounts) {
            conversation.unreadCounts = new Map();
          }
          const prevUnread = conversation.unreadCounts.get(resolvedReceiverId) || 0;
          conversation.unreadCounts.set(resolvedReceiverId, prevUnread + 1);
          await conversation.save();
        }

        const messageData = {
          _id: message._id,
          conversationId,
          senderId: resolvedSenderId,
          receiverId: resolvedReceiverId,
          ciphertext,
          nonce,
          status: initialStatus,
          read: false,
          createdAt: message.createdAt,
          expiresAt: message.expiresAt,
        };

        // Emit to recipient and sender rooms (both resolved and raw IDs)
        io.to(`user:${resolvedReceiverId}`).emit('new_message', { message: messageData, conversationId });
        io.to(`user:${receiverId}`).emit('new_message', { message: messageData, conversationId });

        io.to(`user:${resolvedSenderId}`).emit('new_message', { message: messageData, conversationId });
        io.to(`user:${senderId}`).emit('new_message', { message: messageData, conversationId });

        // Notify recipient of updated unread badge
        io.to(`user:${resolvedReceiverId}`).emit('unread_updated', { conversationId });
        io.to(`user:${receiverId}`).emit('unread_updated', { conversationId });

        if (typeof callback === 'function') {
          callback({ success: true, data: messageData });
        }
      } catch (error) {
        console.error('Error in send_message socket handler:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    // Typing indicator
    socket.on('typing', async ({ conversationId, senderId, receiverId, senderName }) => {
      const resolvedReceiverId = await resolveUserId(receiverId);
      const targetRoom = resolvedReceiverId || receiverId;
      if (targetRoom) {
        io.to(`user:${targetRoom}`).emit('user_typing', {
          conversationId,
          senderId,
          senderName: senderName || 'Someone',
        });
        if (receiverId && receiverId !== targetRoom) {
          io.to(`user:${receiverId}`).emit('user_typing', {
            conversationId,
            senderId,
            senderName: senderName || 'Someone',
          });
        }
      }
    });

    // Stop typing indicator
    socket.on('stop_typing', async ({ conversationId, senderId, receiverId }) => {
      const resolvedReceiverId = await resolveUserId(receiverId);
      const targetRoom = resolvedReceiverId || receiverId;
      if (targetRoom) {
        io.to(`user:${targetRoom}`).emit('user_stopped_typing', {
          conversationId,
          senderId,
        });
        if (receiverId && receiverId !== targetRoom) {
          io.to(`user:${receiverId}`).emit('user_stopped_typing', {
            conversationId,
            senderId,
          });
        }
      }
    });

    // Seen event: Recipient opens chat -> Blue ticks ✓✓ LIVE
    socket.on('mark_as_read', async ({ conversationId, userId }) => {
      try {
        if (!conversationId || !userId) return;

        const resolvedUserId = await resolveUserId(userId);
        const validIds = [resolvedUserId, userId].filter(
          (id) => id && mongoose.Types.ObjectId.isValid(id) && id.toString().length === 24
        );

        const query = { conversationId, status: { $ne: 'seen' } };
        if (validIds.length > 0) {
          query.receiverId = { $in: validIds };
        }

        // Update all unread messages to 'seen' with seenAt timestamp
        await Message.updateMany(query, {
          $set: { status: 'seen', read: true, seenAt: new Date() }
        });

        if (mongoose.Types.ObjectId.isValid(conversationId)) {
          const conversation = await Conversation.findById(conversationId);
          if (conversation) {
            if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
            if (resolvedUserId) conversation.unreadCounts.set(resolvedUserId.toString(), 0);
            conversation.unreadCounts.set(userId.toString(), 0);
            await conversation.save();
          }
        }

        // Emit real-time SEEN event to sender so ticks turn BLUE live!
        io.emit('messages_seen', {
          conversationId,
          seenBy: resolvedUserId || userId,
          seenAt: new Date(),
        });

        if (resolvedUserId) {
          io.to(`user:${resolvedUserId}`).emit('unread_updated', { conversationId });
        }
        io.to(`user:${userId}`).emit('unread_updated', { conversationId });
      } catch (error) {
        console.error('Error handling mark_as_read socket event:', error);
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (currentUserId && userSockets.has(currentUserId)) {
        const socketSet = userSockets.get(currentUserId);
        socketSet.delete(socket.id);
        if (socketSet.size === 0) {
          userSockets.delete(currentUserId);
          io.emit('user_offline', { userId: currentUserId });
        }
      }
      if (rawUserId && rawUserId !== currentUserId && userSockets.has(rawUserId)) {
        const socketSet = userSockets.get(rawUserId);
        socketSet.delete(socket.id);
        if (socketSet.size === 0) {
          userSockets.delete(rawUserId);
        }
      }
    });
  });
};

setupChatSocket.isUserOnline = isUserOnline;

module.exports = setupChatSocket;
