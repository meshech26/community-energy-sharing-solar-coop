const alertService = require('../services/alertService');

/**
 * Controller to handle Alert history and status HTTP endpoints
 */
const getAlerts = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const alerts = await alertService.getAlerts(householdId);
    res.status(200).json(alerts);
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const count = await alertService.getUnreadCount(householdId);
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;
    const alertId = req.params.id;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const alert = await alertService.markAsRead(alertId, householdId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or unauthorized' });
    }

    res.status(200).json(alert);
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    await alertService.markAllAsRead(householdId);
    res.status(200).json({ message: 'All alerts marked as read successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    const householdId = req.user.householdId;
    const alertId = req.params.id;

    if (!householdId) {
      return res.status(400).json({ error: 'User does not belong to any household' });
    }

    const alert = await alertService.deleteAlert(alertId, householdId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or unauthorized' });
    }

    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteAlert
};
