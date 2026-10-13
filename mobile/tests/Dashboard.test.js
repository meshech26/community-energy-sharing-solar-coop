import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../screens/DashboardScreen';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

jest.mock('../store/authStore', () => ({ useAuthStore: jest.fn() }));
jest.mock('../store/chatStore', () => ({ useChatStore: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
}));

let navigation, initializeChat;
beforeEach(() => {
  jest.clearAllMocks();
  navigation = { navigate: jest.fn(), replace: jest.fn() };
  initializeChat = jest.fn();
  useAuthStore.mockReturnValue({ user: { name: 'Test member', email: 'member@example.test', isCoopAdmin: false }, logout: jest.fn() });
  useChatStore.mockReturnValue({ unreadTotal: 0, initializeChat, fetchUnreadCount: jest.fn() });
});

test('greets the member, initializes chat, and hides administrator controls', async () => {
  const screen = await render(<DashboardScreen navigation={navigation} />);
  expect(screen.getByText('Hello, Test member')).toBeTruthy();
  expect(screen.queryByText('Admin Approvals')).toBeNull();
  expect(initializeChat).toHaveBeenCalledWith(useAuthStore().user);
});

test('administrator can open approvals', async () => {
  useAuthStore.mockReturnValue({ user: { name: 'Test admin', isCoopAdmin: true } });
  const screen = await render(<DashboardScreen navigation={navigation} />);
  await fireEvent.press(screen.getByText('Admin Approvals'));
  expect(navigation.navigate).toHaveBeenCalledWith('AdminApprovals');
});

test.each([
  ['Sell Surplus Energy', 'SellEnergy'], ['Listings', 'MyListings'],
  ['History', 'TransactionHistory'], ['Messages', 'Messages'], ['View All', 'TransactionHistory'],
])('%s opens %s', async (label, route) => {
  const screen = await render(<DashboardScreen navigation={navigation} />);
  await fireEvent.press(screen.getByText(label));
  expect(navigation.navigate).toHaveBeenCalledWith(route);
});

test('buy energy opens the Energy Sharing tab', async () => {
  const screen = await render(<DashboardScreen navigation={navigation} />);
  await fireEvent.press(screen.getByText('Buy Energy'));
  expect(navigation.navigate).toHaveBeenCalledWith('MainTabs', { screen: 'Energy Sharing' });
});

test('caps unread badge text at 9+', async () => {
  useChatStore.mockReturnValue({ unreadTotal: 12, initializeChat });
  const screen = await render(<DashboardScreen navigation={navigation} />);
  expect(screen.getAllByText('9+')).toHaveLength(2);
});

test('does not initialize chat without a user', async () => {
  useAuthStore.mockReturnValue({ user: null });
  await render(<DashboardScreen navigation={navigation} />);
  expect(initializeChat).not.toHaveBeenCalled();
});
