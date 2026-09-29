import { Platform } from 'react-native';

// Native imports are deferred so Web and unsupported clients keep their inbox.
export async function createDeviceNotifications(userId, onOpen) {
  if (!['ios', 'android'].includes(Platform.OS)) return null;
  let listener;
  try {
    const Notifications = require('expo-notifications');
    const storageModule = require('@react-native-async-storage/async-storage');
    const storage = storageModule.default || storageModule;
    const key = `solarshare-notifications:${userId}`;
    let disposed = false;
    let enabled = await storage.getItem(`${key}:enabled`) === 'true';
    const seen = new Set(JSON.parse(await storage.getItem(`${key}:seen`) || '[]'));
    const presented = new Map();
    for (const item of await Notifications.getPresentedNotificationsAsync()) {
      const data = item.request.content.data;
      if (data?.recipientId === userId && typeof data.notificationId === 'string') presented.set(data.notificationId, item.request.identifier);
      else if (data?.recipientId) await Notifications.dismissNotificationAsync(item.request.identifier);
    }
    Notifications.setNotificationHandler({ handleNotification: async () => ({
      shouldShowBanner: !disposed, shouldShowList: !disposed,
      shouldPlaySound: false, shouldSetBadge: false,
    }) });
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('community', {
      name: 'Community proposals', importance: Notifications.AndroidImportance.DEFAULT,
    });
    const openResponse = (response) => {
      const data = response?.notification?.request?.content?.data;
      if (!disposed && data?.recipientId === userId && typeof data.notificationId === 'string') {
        onOpen(data.notificationId);
      }
    };
    listener = Notifications.addNotificationResponseReceivedListener(openResponse);
    // Cold starts go through the authenticated notification API too.
    openResponse(await Notifications.getLastNotificationResponseAsync());
    await Notifications.clearLastNotificationResponseAsync();
    const isGranted = (permission) => permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    const permissionState = async () => {
      const permission = await Notifications.getPermissionsAsync();
      enabled = isGranted(permission);
      await storage.setItem(`${key}:enabled`, String(enabled));
      return isGranted(permission) ? 'enabled' : permission.status === 'denied' || permission.canAskAgain === false ? 'denied' : 'not-granted';
    };
    return {
      permissionState,
      async enable() {
        let permission = await Notifications.getPermissionsAsync();
        const previouslyDenied = await storage.getItem(`${key}:permission-denied`) === 'true';
        if (!isGranted(permission) && permission.canAskAgain !== false && permission.status !== 'denied' && !previouslyDenied) {
          permission = await Notifications.requestPermissionsAsync();
        }
        enabled = isGranted(permission);
        await storage.setItem(`${key}:permission-denied`, String(!enabled));
        await storage.setItem(`${key}:enabled`, String(enabled));
        return enabled;
      },
      async sync(items) {
        if (disposed || !enabled) return;
        const permission = await Notifications.getPermissionsAsync();
        if (disposed || !(permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL)) return;
        const current = new Set(items.filter((item) => !item.isRead).map((item) => item.id));
        for (const [id, nativeId] of presented) {
          if (!current.has(id)) { await Notifications.dismissNotificationAsync(nativeId); presented.delete(id); }
        }
        for (const item of items) {
          if (disposed) break;
          if (item.isRead || seen.has(item.id)) continue;
          // Persist before scheduling: a restart must not replay an old alert.
          seen.add(item.id);
          await storage.setItem(`${key}:seen`, JSON.stringify([...seen]));
          if (disposed) break;
          const nativeId = await Notifications.scheduleNotificationAsync({
            content: { title: item.title, body: item.message,
              data: { recipientId: userId, notificationId: item.id } },
            trigger: Platform.OS === 'android' ? { channelId: 'community' } : null,
          });
          if (disposed) await Notifications.dismissNotificationAsync(nativeId);
          else presented.set(item.id, nativeId);
        }
      },
      dispose() {
        disposed = true;
        listener.remove();
        for (const nativeId of presented.values()) void Notifications.dismissNotificationAsync(nativeId).catch(() => {});
      },
    };
  } catch { listener?.remove(); return null; }
}
