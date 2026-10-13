import React from 'react';
import { Alert, View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import SellEnergyScreen from '../screens/SellEnergyScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import PaymentScreen from '../screens/PaymentScreen';

// Screen/service integration: actual location utility and screens, with native
// map, GPS, HTTP and browser-opening boundaries mocked. No real Stripe charge.
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('expo-location', () => ({ Accuracy: { Balanced: 3 }, requestForegroundPermissionsAsync: jest.fn(), getCurrentPositionAsync: jest.fn() }));
jest.mock('expo-linking', () => ({ createURL: jest.fn(() => 'solarshare://payment-complete'), openURL: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../StripeWrapper', () => ({ useStripe: () => ({}), CardField: () => null }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('../store/authStore', () => ({ useAuthStore: () => ({ user: { id: 'buyer', name: 'Buyer' } }) }));
jest.mock('../store/chatStore', () => ({ useChatStore: () => ({ unreadTotal: 0 }) }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: callback => require('react').useEffect(callback, [callback]) }));
jest.mock('../MapWrapper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: React.forwardRef(({ children, ...props }, ref) => <View testID="map" {...props}>{children}</View>), Marker: props => <View testID="marker" {...props} />, Callout: () => null };
});
const coordinates = { latitude: 6.9271, longitude: 79.8612 };
beforeEach(() => {
  jest.clearAllMocks();
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.getCurrentPositionAsync.mockResolvedValue({ coords: coordinates });
  axios.post.mockResolvedValue({ data: { url: 'https://checkout.example.test/session' } });
  axios.get.mockResolvedValue({ data: { data: [] } });
});
afterEach(() => jest.restoreAllMocks());

test('GPS permission -> coordinates -> sell map marker -> listing request', async () => {
  const navigation = { navigate: jest.fn() };
  const screen = await render(<SellEnergyScreen navigation={navigation} />);
  await fireEvent.press(screen.getByText('Use My Current Location'));
  await waitFor(() => expect(screen.getByTestId('marker').props.coordinate).toEqual(coordinates));
  expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('Submit for Approval'));
  expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/energy/listings'), expect.objectContaining({ quantity: 10, unitPrice: 45, location: coordinates }));
  expect(navigation.navigate).toHaveBeenCalledWith('SellSuccess');
});

test('denied GPS permission shows guidance without fetching position or placing marker', async () => {
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const screen = await render(<SellEnergyScreen navigation={{ navigate: jest.fn() }} />);
  await fireEvent.press(screen.getByText('Use My Current Location'));
  expect(alert).toHaveBeenCalledWith('Permission Denied', expect.any(String));
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  expect(screen.queryByTestId('marker')).toBeNull();
  expect(axios.post).not.toHaveBeenCalled();
});

test('marketplace renders API coordinates with privacy offset and marker opens buying action', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.75);
  const listing = { _id: 'offer', sellerId: { name: 'Solar seller' }, location: coordinates, availableQuantity: 10, approvedUnitPrice: 45 };
  axios.get.mockResolvedValue({ data: { data: [listing] } });
  const navigation = { navigate: jest.fn() };
  const screen = await render(<MarketplaceScreen navigation={navigation} />);
  await waitFor(() => expect(screen.getAllByTestId('marker')).toHaveLength(1));
  const marker = screen.getByTestId('marker');
  expect(marker.props.coordinate.latitude).toBeCloseTo(coordinates.latitude + 0.001);
  expect(marker.props.coordinate.longitude).toBeCloseTo(coordinates.longitude + 0.001);
  await fireEvent.press(marker);
  await fireEvent.press(screen.getByText('Buy Energy'));
  expect(navigation.navigate).toHaveBeenCalledWith('ListingDetails', { listing: expect.objectContaining({ _id: 'offer' }) });
});

function CheckoutFlow() {
  const [route, setRoute] = React.useState({ name: 'OrderSummary', params: { total: 450, quantity: 10, seller: 'Solar seller', listingId: 'offer' } });
  const navigation = { navigate: (name, params) => setRoute({ name, params }) };
  return route.name === 'Payment' ? <PaymentScreen route={route} navigation={navigation} /> : <OrderSummaryScreen route={route} navigation={navigation} />;
}
test('order summary -> payment -> Checkout API -> external Stripe URL', async () => {
  const screen = await render(<CheckoutFlow />);
  await fireEvent.press(screen.getByText('Proceed to Payment'));
  await fireEvent.press(screen.getByText('Proceed to Stripe'));
  expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/payments/create-checkout-session'), {
    amount: 450, currency: 'lkr', success_url: 'solarshare://payment-complete?status=success&total=450&quantity=10&seller=Solar%20seller&listingId=offer',
  });
  expect(Linking.openURL).toHaveBeenCalledWith('https://checkout.example.test/session');
});

test('Checkout API failure shows an error and does not open Stripe', async () => {
  axios.post.mockRejectedValue(new Error('offline'));
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const screen = await render(<CheckoutFlow />);
  await fireEvent.press(screen.getByText('Proceed to Payment'));
  await fireEvent.press(screen.getByText('Proceed to Stripe'));
  expect(alert).toHaveBeenCalledWith('Payment Error', expect.any(String));
  expect(Linking.openURL).not.toHaveBeenCalled();
});
