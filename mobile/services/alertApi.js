import api from './api';

/**
 * API methods for Alerts Configuration and History
 */
const alertApi = {
  // Fetch all alerts
  getAlerts: async () => {
    const response = await api.get('/alerts');
    return response.data;
  },

  // Fetch count of unread notifications
  getUnreadCount: async () => {
    const response = await api.get('/alerts/unread-count');
    return response.data;
  },

  // Mark specific alert as read
  markAsRead: async (alertId) => {
    const response = await api.patch(`/alerts/${alertId}/read`);
    return response.data;
  },

  // Mark all alerts as read for this household
  markAllAsRead: async () => {
    const response = await api.patch('/alerts/read-all');
    return response.data;
  },

  // Delete an alert from log
  deleteAlert: async (alertId) => {
    const response = await api.delete(`/alerts/${alertId}`);
    return response.data;
  },
};

export default alertApi;
