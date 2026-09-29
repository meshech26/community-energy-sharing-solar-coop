import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import storage from '@react-native-async-storage/async-storage';
import { createDeviceNotifications } from '../services/deviceNotifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 }, IosAuthorizationStatus: { PROVISIONAL: 3 },
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(), clearLastNotificationResponseAsync: jest.fn(),
  getPresentedNotificationsAsync: jest.fn().mockResolvedValue([]),
  getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(), dismissNotificationAsync: jest.fn().mockResolvedValue(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
const originalOS = Platform.OS;
const values = new Map();
const item = { id: 'n1', title: 'Reminder', message: 'Open proposal', isRead: false };
beforeEach(() => {
  jest.clearAllMocks(); values.clear(); Platform.OS = 'android';
  storage.getItem.mockImplementation(async (key) => values.get(key) || null);
  storage.setItem.mockImplementation(async (key, value) => { values.set(key, value); });
  Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
  Notifications.requestPermissionsAsync.mockResolvedValue({ granted: true });
  Notifications.scheduleNotificationAsync.mockResolvedValue('native1');
  Notifications.getLastNotificationResponseAsync.mockResolvedValue(null);
});
afterEach(() => { Platform.OS = originalOS; });
test('permission inspection recognizes existing grants without prompting', async () => {
  const manager = await createDeviceNotifications('u1', jest.fn());
  expect(await manager.permissionState()).toBe('enabled');
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  await manager.sync([item]);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  manager.dispose();
});
test('web never invokes native notification APIs', async () => {
  Platform.OS = 'web'; expect(await createDeviceNotifications('u1', jest.fn())).toBeNull();
  expect(Notifications.setNotificationHandler).not.toHaveBeenCalled();
});
test('permission is requested only on enable; denial schedules nothing', async () => {
  Notifications.getPermissionsAsync.mockResolvedValue({ granted: false, status: 'undetermined', canAskAgain: true });
  Notifications.requestPermissionsAsync.mockResolvedValue({ granted: false });
  const manager = await createDeviceNotifications('u1', jest.fn());
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(await manager.enable()).toBe(false); await manager.sync([item]);
  await manager.enable();
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled(); manager.dispose();
});
test('immediate alerts deduplicate across polling and app restarts', async () => {
  const manager = await createDeviceNotifications('u1', jest.fn());
  await manager.enable(); await manager.sync([item]); await manager.sync([item]); manager.dispose();
  const restarted = await createDeviceNotifications('u1', jest.fn()); await restarted.sync([item]);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.scheduleNotificationAsync.mock.calls[0][0].trigger).toEqual({ channelId: 'community' });
  restarted.dispose();
});
test('withdrawn/read reminders are dismissed and disposed sessions cannot alert', async () => {
  const manager = await createDeviceNotifications('u1', jest.fn());
  await manager.enable(); await manager.sync([item]); await manager.sync([]);
  expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('native1');
  manager.dispose(); await manager.sync([{ ...item, id: 'n2' }]);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});
test('notification taps validate recipient and cold-start responses are cleared', async () => {
  const onOpen = jest.fn();
  Notifications.getLastNotificationResponseAsync.mockResolvedValue({ notification: { request: { content: { data: { recipientId: 'u1', notificationId: 'n1' } } } } });
  const manager = await createDeviceNotifications('u1', onOpen);
  expect(onOpen).toHaveBeenCalledWith('n1');
  Notifications.addNotificationResponseReceivedListener.mock.calls[0][0]({ notification: { request: { content: { data: { recipientId: 'other', notificationId: 'n2' } } } } });
  expect(onOpen).toHaveBeenCalledTimes(1); expect(Notifications.clearLastNotificationResponseAsync).toHaveBeenCalled(); manager.dispose();
});
