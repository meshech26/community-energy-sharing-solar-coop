import { NavigationContainer } from '@react-navigation/native';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import NotificationProvider from '../components/community/NotificationProvider';
import NotificationBell from '../components/community/NotificationBell';
import NotificationsScreen from '../screens/community/NotificationsScreen';
import { listNotifications, markNotificationRead } from '../services/notificationService';
import { createDeviceNotifications } from '../services/deviceNotifications';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';

jest.mock('../services/notificationService', () => ({ listNotifications: jest.fn(), markNotificationRead: jest.fn() }));
jest.mock('../services/deviceNotifications', () => ({ createDeviceNotifications: jest.fn() }));
// The native RefreshControl host drops props in the RN Jest preset.
jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => ({ __esModule: true, default: 'RefreshControl' }));
const item = { id: 'notice-1', proposalId: 'proposal-1', title: 'New community proposal', message: 'Battery storage is now available.', isRead: false, createdAt: '2026-09-09T10:00:00Z' };
const navigation = { navigate: jest.fn() };
const manager = { sync: jest.fn().mockResolvedValue(), dispose: jest.fn(), enable: jest.fn(), permissionState: jest.fn() };
const originalOS = Platform.OS;
test('icon-only bell shows the current member unread badge and opens Notifications', async () => {
  const view = await screen();
  const bell = await view.findByLabelText('Notifications, 1 unread');
  expect(view.getByText('1')).toBeTruthy();
  // The only visible Notifications text is the screen heading, not the bell.
  expect(view.getAllByText('Notifications')).toHaveLength(1);
  await fireEvent.press(bell);
  expect(navigation.navigate).toHaveBeenCalledWith('Notifications');
});
test('bell hides the badge when the member has no unread notifications', async () => {
  listNotifications.mockResolvedValue({ notifications: [], unreadCount: 0, hasMore: false });
  const view = await screen();
  await view.findByText('No notifications yet');
  expect(view.getByLabelText('Notifications, 0 unread')).toBeTruthy();
  expect(view.queryByText('0')).toBeNull();
});
test('cancellation notice opens the referenced proposal and remains as read history', async () => {
  const cancelled = { ...item, type: 'proposal_cancelled', title: 'Proposal cancelled', message: 'Battery project has been cancelled. Reason: Changed plans' };
  listNotifications.mockResolvedValue({ notifications: [cancelled], unreadCount: 1, hasMore: false });
  markNotificationRead.mockResolvedValue({ ...cancelled, isRead: true });
  const view = await screen();
  await view.findByText(cancelled.message);
  listNotifications.mockResolvedValue({ notifications: [{ ...cancelled, isRead: true }], unreadCount: 0, hasMore: false });
  await fireEvent.press(view.getByLabelText('Unread notification: Proposal cancelled'));
  expect(await view.findByLabelText('Read notification: Proposal cancelled')).toBeTruthy();
  expect(await view.findByLabelText('Notifications, 0 unread')).toBeTruthy();
  expect(navigation.navigate).toHaveBeenCalledWith('ProposalDetails', { proposalId: cancelled.proposalId });
});
async function screen() {
  return render(<NavigationContainer><NotificationProvider navigation={navigation}>
    <NotificationBell onPress={() => navigation.navigate('Notifications')} /><NotificationsScreen />
  </NotificationProvider></NavigationContainer>);
}
beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'ios';
  manager.enable.mockResolvedValue(false);
  manager.permissionState.mockResolvedValue('not-granted');
  useAuthStore.getState().login({ id: 'member', isCoopAdmin: false }, 'test-token');
  listNotifications.mockResolvedValue({ notifications: [item], unreadCount: 1, hasMore: false });
  markNotificationRead.mockResolvedValue({ ...item, isRead: true });
  createDeviceNotifications.mockResolvedValue(manager);
});
afterEach(async () => { await cleanup(); useAuthStore.getState().logout(); Platform.OS = originalOS; });

test('inbox renders unread/read notifications, message, and unread bell', async () => {
  listNotifications.mockResolvedValue({ notifications: [item, { ...item, id: 'notice-2', title: 'Voting closes soon', isRead: true }], unreadCount: 1, hasMore: false });
  const view = await screen();
  expect(await view.findByLabelText('Unread notification: New community proposal')).toBeTruthy();
  expect(view.getByLabelText('Unread notification: New community proposal').props.accessibilityValue.text).toContain(item.message);
  expect(view.getAllByText(item.message)[0].props.numberOfLines).toBeUndefined();
  expect(view.getByLabelText('Read notification: Voting closes soon')).toBeTruthy();
  expect(await view.findByLabelText('Notifications, 1 unread')).toBeTruthy();
});
test('opening a notification marks it read and navigates using the authenticated API response', async () => {
  const view = await screen();
  await fireEvent.press(await view.findByLabelText('Unread notification: New community proposal'));
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('ProposalDetails', { proposalId: 'proposal-1' }));
  expect(markNotificationRead).toHaveBeenCalledWith('notice-1');
});
test('transfer notification opens the authenticated transfer request instead of a proposal', async () => {
  markNotificationRead.mockResolvedValue({ ...item, proposalId: undefined, transferRequestId: 'transfer-1', isRead: true });
  const view = await screen();
  await fireEvent.press(await view.findByLabelText('Unread notification: New community proposal'));
  expect(navigation.navigate).toHaveBeenCalledWith('AdminTransferRequest', { transferRequestId: 'transfer-1' });
  expect(navigation.navigate).not.toHaveBeenCalledWith('ProposalDetails', expect.anything());
});
test('whole-card tap updates the read row and unread count and opens the proposal', async () => {
  const view = await screen();
  await view.findByText(item.message);
  listNotifications.mockResolvedValue({ notifications: [{ ...item, isRead: true }], unreadCount: 0, hasMore: false });
  await fireEvent.press(await view.findByLabelText('Unread notification: New community proposal'));
  expect(await view.findByLabelText('Read notification: New community proposal')).toBeTruthy();
  expect(await view.findByLabelText('Notifications, 0 unread')).toBeTruthy();
  expect(markNotificationRead).toHaveBeenCalledWith(item.id);
  expect(navigation.navigate).toHaveBeenCalledWith('ProposalDetails', { proposalId: item.proposalId });
});
test('expired or inaccessible reminder displays an error and does not open a proposal', async () => {
  markNotificationRead.mockRejectedValue({ response: { status: 404, data: { message: 'Notification is no longer available.' } } });
  const view = await screen();
  await fireEvent.press(await view.findByLabelText('Unread notification: New community proposal'));
  expect(await view.findByText('Notification is no longer available.')).toBeTruthy();
  expect(navigation.navigate).toHaveBeenCalledWith('Notifications');
});
test('denied device permission leaves inbox usable and requires an explicit tap', async () => {
  const view = await screen(); await view.findByText(item.message);
  expect(manager.enable).not.toHaveBeenCalled();
  await fireEvent.press(await view.findByText('Enable notifications'));
  expect(await view.findByText(/Permission was not granted/)).toBeTruthy();
  expect(view.getByText(item.message)).toBeTruthy();
});
test('unsupported device environment safely retains the in-app inbox', async () => {
  createDeviceNotifications.mockResolvedValue(null);
  const view = await screen(); await view.findByText(item.message);
  expect(view.queryByText('Enable notifications')).toBeNull();
  expect(view.queryByText('Stay updated')).toBeNull();
  expect(view.getByText(item.message)).toBeTruthy();
});
test('empty inbox and request failures provide useful feedback', async () => {
  listNotifications.mockResolvedValue({ notifications: [], unreadCount: 0, hasMore: false });
  const view = await screen(); expect(await view.findByText('No notifications yet')).toBeTruthy();
  listNotifications.mockRejectedValue(new Error('offline'));
  await fireEvent(view.getByTestId('notification-pull-refresh'), 'refresh');
  expect(await view.findByText('We could not reach Solar Share. Please check your connection and try again.')).toBeTruthy();
});
test('web shows no permission control', async () => {
  Platform.OS = 'web';
  const view = await screen(); await view.findByText(item.message);
  expect(view.queryByText('Stay updated')).toBeNull();
  expect(view.queryByText('Enable notifications')).toBeNull();
});
test('already granted permission hides the card without prompting', async () => {
  manager.permissionState.mockResolvedValue('enabled');
  const view = await screen(); await view.findByText(item.message);
  expect(view.queryByText('Stay updated')).toBeNull();
  expect(manager.enable).not.toHaveBeenCalled();
});
test('granting permission hides the card', async () => {
  manager.enable.mockResolvedValue(true);
  const view = await screen();
  await fireEvent.press(await view.findByText('Enable notifications'));
  await waitFor(() => expect(view.queryByText('Stay updated')).toBeNull());
});
test('pull to refresh loads new records', async () => {
  const view = await screen(); await view.findByText(item.message);
  listNotifications.mockResolvedValue({ notifications: [{ ...item, title: 'Fresh proposal' }], unreadCount: 1, hasMore: false });
  await fireEvent(view.getByTestId('notification-pull-refresh'), 'refresh');
  expect(await view.findByText('Fresh proposal')).toBeTruthy();
});
test('native notification tap uses the inbox ownership check and logout disposes the listener', async () => {
  const view = await screen(); await view.findByText(item.message);
  await waitFor(() => expect(createDeviceNotifications).toHaveBeenCalled());
  await createDeviceNotifications.mock.calls[0][1]('notice-1');
  expect(markNotificationRead).toHaveBeenCalledWith('notice-1');
  await view.unmount(); expect(manager.dispose).toHaveBeenCalled();
});
test('pagination remains available and refreshing keeps loaded pages without duplicates', async () => {
  const older = { ...item, id: 'older', title: 'Earlier proposal', isRead: true };
  listNotifications.mockImplementation(async (page = 1) => ({ notifications: page === 1 ? [item] : [older], unreadCount: 1, hasMore: page === 1 }));
  const view = await screen();
  await fireEvent.press(await view.findByText('Load more'));
  expect(await view.findByText('Earlier proposal')).toBeTruthy();
  await fireEvent(view.getByTestId('notification-pull-refresh'), 'refresh');
  await waitFor(() => expect(view.getAllByText('Earlier proposal')).toHaveLength(1));
  expect(view.getAllByText(item.title)).toHaveLength(1);
});
test('inbox loads automatically with no refresh button or separate card action links', async () => {
  const view = await screen();
  expect(await view.findByText(item.message)).toBeTruthy();
  expect(listNotifications).toHaveBeenCalled();
  expect(view.queryByLabelText('Refresh notifications')).toBeNull();
  expect(view.queryByText('View proposal ›')).toBeNull();
  expect(view.queryByText('Mark as read')).toBeNull();
  expect(view.getByLabelText(`Unread notification: ${item.title}`)).toBeTruthy();
});
test('reading changes the border and dot while preserving history and newest-first order on reopening', async () => {
  const older = { ...item, id: 'older', title: 'Older update', createdAt: '2026-09-08T10:00:00Z', isRead: true };
  let records = [item, older];
  listNotifications.mockImplementation(async () => ({ notifications: records, unreadCount: records.filter((entry) => !entry.isRead).length, hasMore: false }));
  markNotificationRead.mockImplementation(async () => {
    records = records.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry);
    return records[0];
  });
  const view = await screen();
  await view.findByText(item.title);
  expect(view.getByText(item.title).parent).toHaveStyle({ borderWidth: 1, borderLeftWidth: 4, borderLeftColor: '#16764C', backgroundColor: '#F5FAF6' });
  expect(view.getByText(older.title).parent).toHaveStyle({ borderWidth: 1, borderLeftWidth: 1, borderColor: '#DDE5DF', borderLeftColor: '#DDE5DF' });
  expect(view.getByText('●')).toHaveStyle({ color: '#16764C' });
  expect(view.queryByText('Read')).toBeNull();
  expect(view.queryByText('Unread')).toBeNull();
  await fireEvent.press(view.getByLabelText(`Unread notification: ${item.title}`));
  await view.findByLabelText('Notifications, 0 unread');
  expect(view.queryByText('●')).toBeNull();
  expect(view.queryByText('Read')).toBeNull();
  expect(view.queryByText('Unread')).toBeNull();
  expect(view.getByText(item.title).parent).toHaveStyle({ borderWidth: 1, borderLeftWidth: 1, borderColor: '#DDE5DF', borderLeftColor: '#DDE5DF' });
  expect(view.getAllByLabelText(/^Read notification:/).map((card) => card.props.accessibilityLabel)).toEqual([`Read notification: ${item.title}`, `Read notification: ${older.title}`]);
  await view.unmount();
  const reopened = await screen();
  expect(await reopened.findByLabelText(`Read notification: ${item.title}`)).toBeTruthy();
  expect(reopened.getAllByLabelText(/^Read notification:/)).toHaveLength(2);
});
