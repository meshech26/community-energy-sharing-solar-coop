const Alert = require('../models/Alert');
const mockDb = require('../utils/mockDb');

/**
 * Service to manage alerts and notifications
 */
class AlertService {
  /**
   * Check monthly usage and trigger alerts if appropriate
   */
  async checkThresholds(householdId, userId, currentMonthlyUsage, limitConfig) {
    const { monthlyLimit, warningPercentage } = limitConfig;
    if (!monthlyLimit || monthlyLimit <= 0) return;

    const pctUsed = (currentMonthlyUsage / monthlyLimit) * 100;
    
    let alertType = null;
    let severity = 'info';
    let message = '';
    let thresholdValue = 0;

    if (pctUsed >= 100) {
      alertType = 'LIMIT_EXCEEDED';
      severity = 'critical';
      message = 'You have exceeded your monthly energy limit.';
      thresholdValue = monthlyLimit;
    } else if (pctUsed >= 90) {
      alertType = 'HIGH_USAGE';
      severity = 'critical';
      message = `Warning! You have used 90% of your monthly energy limit.`;
      thresholdValue = Math.round(monthlyLimit * 0.9);
    } else if (pctUsed >= warningPercentage) {
      alertType = 'THRESHOLD_WARNING';
      severity = 'warning';
      message = `You have used ${warningPercentage}% of your monthly energy limit.`;
      thresholdValue = Math.round(monthlyLimit * (warningPercentage / 100));
    }

    if (alertType) {
      await this.triggerAlertIfNew(householdId, userId, alertType, severity, message, thresholdValue, currentMonthlyUsage);
    }
  }

  /**
   * Triggers a threshold alert if a similar alert has not been triggered this calendar month
   */
  async triggerAlertIfNew(householdId, userId, type, severity, message, threshold, currentValue) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    if (global.dbOffline) {
      // In-Memory check & insert
      const existingAlert = mockDb.alerts.find(a => 
        a.householdId === householdId && 
        a.type === type && 
        a.createdAt >= startOfMonth
      );

      if (!existingAlert) {
        mockDb.insertAlert({
          userId,
          householdId,
          type,
          severity,
          message,
          threshold,
          currentValue: parseFloat(currentValue.toFixed(1))
        });

        this.sendLocalPushNotification(message, severity);
      }
      return;
    }

    // Real MongoDB query
    const existingAlert = await Alert.findOne({
      householdId,
      type,
      createdAt: { $gte: startOfMonth }
    }).exec();

    if (!existingAlert) {
      const alert = new Alert({
        userId,
        householdId,
        type,
        severity,
        message,
        threshold,
        currentValue: parseFloat(currentValue.toFixed(1)),
        isRead: false
      });
      await alert.save();

      this.sendLocalPushNotification(message, severity);
    }
  }

  /**
   * Triggers an unusual consumption alert (throttled to once every 6 hours)
   */
  async createUnusualConsumptionAlert(householdId, userId, currentConsumption, averageConsumption) {
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    if (global.dbOffline) {
      // In-Memory
      const existingAlert = mockDb.alerts.find(a => 
        a.householdId === householdId && 
        a.type === 'UNUSUAL_CONSUMPTION' && 
        a.createdAt >= sixHoursAgo
      );

      if (!existingAlert) {
        const message = `Unusual energy usage detected: Current usage of ${currentConsumption.toFixed(1)} kW is significantly higher than your typical average of ${averageConsumption.toFixed(1)} kW.`;
        mockDb.insertAlert({
          userId,
          householdId,
          type: 'UNUSUAL_CONSUMPTION',
          severity: 'warning',
          message,
          threshold: parseFloat(averageConsumption.toFixed(1)),
          currentValue: parseFloat(currentConsumption.toFixed(1))
        });

        this.sendLocalPushNotification('Unusual electricity consumption detected.', 'warning');
      }
      return;
    }

    // Real MongoDB query
    const existingAlert = await Alert.findOne({
      householdId,
      type: 'UNUSUAL_CONSUMPTION',
      createdAt: { $gte: sixHoursAgo }
    }).exec();

    if (!existingAlert) {
      const message = `Unusual energy usage detected: Current usage of ${currentConsumption.toFixed(1)} kW is significantly higher than your typical average of ${averageConsumption.toFixed(1)} kW.`;
      const alert = new Alert({
        userId,
        householdId,
        type: 'UNUSUAL_CONSUMPTION',
        severity: 'warning',
        message,
        threshold: parseFloat(averageConsumption.toFixed(1)),
        currentValue: parseFloat(currentConsumption.toFixed(1)),
        isRead: false
      });
      await alert.save();

      this.sendLocalPushNotification('Unusual electricity consumption detected.', 'warning');
    }
  }

  /**
   * Retrieve alerts history for a household
   */
  async getAlerts(householdId) {
    if (global.dbOffline) {
      return mockDb.getAlerts(householdId);
    }
    return await Alert.find({ householdId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get count of unread alerts for a household
   */
  async getUnreadCount(householdId) {
    if (global.dbOffline) {
      return mockDb.alerts.filter(a => a.householdId === householdId && !a.isRead).length;
    }
    return await Alert.countDocuments({ householdId, isRead: false }).exec();
  }

  /**
   * Mark a specific alert as read
   */
  async markAsRead(alertId, householdId) {
    if (global.dbOffline) {
      return mockDb.markAsRead(alertId, householdId);
    }
    return await Alert.findOneAndUpdate(
      { _id: alertId, householdId },
      { isRead: true },
      { new: true }
    ).exec();
  }

  /**
   * Mark all alerts as read for a household
   */
  async markAllAsRead(householdId) {
    if (global.dbOffline) {
      mockDb.markAllAsRead(householdId);
      return;
    }
    return await Alert.updateMany(
      { householdId, isRead: false },
      { isRead: true }
    ).exec();
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId, householdId) {
    if (global.dbOffline) {
      return mockDb.deleteAlert(alertId, householdId);
    }
    return await Alert.findOneAndDelete({ _id: alertId, householdId }).exec();
  }

  /**
   * Mock push notifications logging
   */
  sendLocalPushNotification(message, severity) {
    console.log(`[PUSH NOTIFICATION] [Severity: ${severity.toUpperCase()}] ${message}`);
  }
}

module.exports = new AlertService();
