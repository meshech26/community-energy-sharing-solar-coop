import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import axios from 'axios';
import MarketplaceScreen from '../screens/MarketplaceScreen';

jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('../store/authStore', () => ({ useAuthStore: () => ({ user: { id: 'buyer', name: 'Buyer', email: 'buyer@example.test' } }) }));
jest.mock('../store/chatStore', () => ({ useChatStore: () => ({ unreadTotal: 0 }) }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: (callback) => require('react').useEffect(callback, [callback]) }));
jest.mock('../MapWrapper', () => ({ __esModule: true, default: () => null, Marker: () => null, Callout: () => null }));
jest.mock('../utils/locationUtils', () => ({ getCurrentLocation: jest.fn().mockResolvedValue(null), addPrivacyOffset: (location) => location, DEFAULT_REGION: {}, calculateDistance: jest.fn(), formatDistance: jest.fn() }));

const listing = { _id: 'offer', sellerId: { _id: 'seller', name: 'Solar household' }, availableQuantity: 8, approvedQuantity: 20, approvedUnitPrice: 40, availableDate: 'Tomorrow' };
let navigation;
beforeEach(() => {
  jest.clearAllMocks();
  navigation = { navigate: jest.fn() };
  axios.get.mockResolvedValue({ data: { data: [listing] } });
});
afterEach(() => jest.restoreAllMocks());

async function openList() {
  const screen = await render(<MarketplaceScreen navigation={navigation} />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
  await fireEvent.press(screen.getByText('List View'));
  return screen;
}

test('loads real listings and buys using the unchanged listing payload', async () => {
  const screen = await openList();
  expect(screen.getByText('Solar household')).toBeTruthy();
  expect(screen.getByText('8 kWh')).toBeTruthy();
  await fireEvent.press(screen.getByText('Buy Energy'));
  expect(navigation.navigate).toHaveBeenCalledWith('ListingDetails', { listing });
});

test.each([
  { _id: 'buyer', name: 'Own by id' },
  { _id: 'another', name: 'Own by email', email: 'BUYER@example.test' },
])('excludes own listing identified by %j', async (sellerId) => {
  axios.get.mockResolvedValue({ data: { data: [listing, { ...listing, _id: 'own', sellerId }] } });
  const screen = await openList();
  expect(screen.queryByText(sellerId.name)).toBeNull();
  expect(screen.getByText('Solar household')).toBeTruthy();
});

test.each([['0', '9'], ['50', '39']])('filters by input %s and clears filters', async (placeholder, value) => {
  const screen = await openList();
  await fireEvent.changeText(screen.getByPlaceholderText(placeholder), value);
  expect(screen.queryByText('Solar household')).toBeNull();
  expect(screen.getByText('No Matching Listings')).toBeTruthy();
  await fireEvent.press(screen.getByText('Clear Filters'));
  expect(screen.getByText('Solar household')).toBeTruthy();
});

test('own-only response shows the member empty state', async () => {
  axios.get.mockResolvedValue({ data: { data: [{ ...listing, sellerId: { _id: 'buyer' } }] } });
  const screen = await openList();
  expect(screen.getByText('No Listings from Other Members')).toBeTruthy();
  await fireEvent.press(screen.getByText('View My Listings'));
  expect(navigation.navigate).toHaveBeenCalledWith('MyListings');
});

// Characterize the existing demo fallback, not a claim of real available stock.
test('network failure logs the error and shows the existing demo fallback', async () => {
  const error = new Error('Network unavailable');
  axios.get.mockRejectedValue(error);
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const screen = await openList();
  expect(log).toHaveBeenCalledWith(error);
  expect(screen.getByText('Household A')).toBeTruthy();
});
