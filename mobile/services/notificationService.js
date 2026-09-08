import { Platform } from 'react-native';

// Dynamically import expo-notifications to prevent errors if not installed
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications package is not installed. Using mock notification service.');
}

// Configure how notifications are handled when the app is running in the foreground
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Service to manage local and push notifications using Expo
 */
const notificationService = {
  /**
   * Request permissions to show notifications.
   * Returns true if permissions are granted.
   */
  requestPermissions: async () => {
    if (Platform.OS === 'web') return false;
    if (!Notifications) return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Android-specific channel configuration for sound/vibration
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  /**
   * Schedule a local notification to appear immediately on the device.
   */
  showLocalNotification: async (title, body) => {
    console.log(`[LOCAL NOTIFICATION] ${title}: ${body}`);
    
    if (Platform.OS === 'web') return;
    if (!Notifications) return;

    try {
      // Confirm permissions before scheduling
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // trigger immediately
      });
    } catch (error) {
      console.error('Error displaying local notification:', error);
    }
  },
};

export default notificationService;
