import { create } from 'zustand';
import alertApi from '../services/alertApi';
import notificationService from '../services/notificationService';

/**
 * Zustand store to manage Alerts history, unread counters, and local push notifications.
 */
export const useAlertStore = create((set, get) => ({
  alerts: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Fetch list of alerts for history screen
  fetchAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await alertApi.getAlerts();
      
      // Look for new unread alerts to trigger push notifications on screen refresh
      const previousAlerts = get().alerts;
      if (previousAlerts.length > 0) {
        // Compare with incoming alerts and trigger notifications for any newer alerts
        const currentUnreadIds = new Set(previousAlerts.filter(a => !a.isRead).map(a => a._id));
        const newUnreadAlerts = data.filter(a => !a.isRead && !currentUnreadIds.has(a._id));
        
        for (const alert of newUnreadAlerts) {
          notificationService.showLocalNotification(
            alert.type.replace(/_/g, ' '),
            alert.message
          );
        }
      }

      set({ alerts: data, loading: false });
      
      // Keep unread count synchronized
      await get().fetchUnreadCount();
    } catch (err) {
      console.error('Error fetching alerts:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to fetch alert history';
      set({ error: errMsg, loading: false });
    }
  },

  // Fetch only the count of unread alerts
  fetchUnreadCount: async () => {
    try {
      const data = await alertApi.getUnreadCount();
      set({ unreadCount: data.unreadCount });
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  },

  // Mark a specific alert as read
  markAsRead: async (alertId) => {
    try {
      await alertApi.markAsRead(alertId);
      
      // Update locally for instant UI update
      set((state) => {
        const updatedAlerts = state.alerts.map((a) =>
          a._id === alertId ? { ...a, isRead: true } : a
        );
        const unreadCount = updatedAlerts.filter((a) => !a.isRead).length;
        return { alerts: updatedAlerts, unreadCount };
      });
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  },

  // Mark all alerts as read
  markAllAsRead: async () => {
    set({ loading: true });
    try {
      await alertApi.markAllAsRead();
      
      // Update all locally
      set((state) => {
        const updatedAlerts = state.alerts.map((a) => ({ ...a, isRead: true }));
        return { alerts: updatedAlerts, unreadCount: 0, loading: false };
      });
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
      set({ loading: false });
    }
  },

  // Delete an alert from historical log
  deleteAlert: async (alertId) => {
    try {
      await alertApi.deleteAlert(alertId);
      
      // Remove locally
      set((state) => {
        const updatedAlerts = state.alerts.filter((a) => a._id !== alertId);
        const unreadCount = updatedAlerts.filter((a) => !a.isRead).length;
        return { alerts: updatedAlerts, unreadCount };
      });
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  },
}));
