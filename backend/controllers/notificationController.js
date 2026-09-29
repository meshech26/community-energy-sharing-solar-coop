const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { suppressIneligibleReminders, relevantNotificationFilter } = require('../services/notificationService');

const toSafeNotification = (item) => ({
  id: item._id, proposalId: item.proposal, type: item.type, title: item.title,
  message: item.message, isRead: item.isRead, createdAt: item.createdAt,
  ...(item.transferRequest ? { transferRequestId: item.transferRequest } : {}),
});

async function listNotifications(req, res) {
  try {
    await suppressIneligibleReminders(req.user._id);
    const filter = await relevantNotificationFilter(req.user._id);
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isSafeInteger(page) || page < 1) return res.status(400).json({ message: 'page must be a positive integer.' });
    const limit = 50;
    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);
    return res.json({ notifications: items.map(toSafeNotification), unreadCount, hasMore: page * limit < total });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load notifications. Please try again.' });
  }
}

async function readNotification(req, res) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Invalid notification ID.' });
    await suppressIneligibleReminders(req.user._id);
    const item = await Notification.findOneAndUpdate(
      { ...await relevantNotificationFilter(req.user._id), _id: req.params.id },
      { $set: { isRead: true } }, { returnDocument: 'after' }
    );
    if (!item) return res.status(404).json({ message: 'Notification is no longer available.' });
    return res.json({ notification: toSafeNotification(item) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to mark notification as read.' });
  }
}

module.exports = { listNotifications, readNotification };
