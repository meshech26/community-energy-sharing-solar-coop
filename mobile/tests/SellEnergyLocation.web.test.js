import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import * as Location from 'expo-location';
import SellEnergyScreen from '../screens/SellEnergyScreen';
import MapView from '../MapWrapper.web';

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('../MapWrapper', () => jest.requireActual('../MapWrapper.web'));
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const coordinates = { latitude: 7.2906, longitude: 80.6337 };
const findIframe = node => {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'iframe') return node;
  return (node.children ?? []).map(findIframe).find(Boolean);
};
const getMapUrl = screen => new URL(findIframe(screen.toJSON()).props.src);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.getCurrentPositionAsync.mockResolvedValue({ coords: coordinates });
});

afterEach(() => jest.restoreAllMocks());

test('current location loads automatically and the button resets a panned map even at the same coordinates', async () => {
  const screen = await render(<SellEnergyScreen navigation={{ navigate: jest.fn() }} />);
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
  expect(getMapUrl(screen).searchParams.get('marker')).toBe('7.2906,80.6337');
  const bounds = getMapUrl(screen).searchParams.get('bbox').split(',').map(Number);
  expect(bounds[0]).toBeCloseTo(coordinates.longitude - 0.005);
  expect(bounds[1]).toBeCloseTo(coordinates.latitude - 0.005);
  expect(bounds[2]).toBeCloseTo(coordinates.longitude + 0.005);
  expect(bounds[3]).toBeCloseTo(coordinates.latitude + 0.005);
  expect(screen.getByText('Coordinates: 7.2906, 80.6337')).toBeTruthy();
  expect(screen.queryByText(/Tap a community seller/)).toBeNull();

  // The embedded map owns its pan/zoom state. Replacing its iframe restores
  // the requested viewport even when the GPS coordinates and URL are unchanged.
  const initialFrame = findIframe(screen.root);
  await fireEvent.press(screen.getByText('Use My Current Location'));
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(2);
  expect(getMapUrl(screen).searchParams.get('marker')).toBe('7.2906,80.6337');
  expect(findIframe(screen.root)).not.toBe(initialFrame);

  Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 0, longitude: 0 } });
  await fireEvent.press(screen.getByText('Use My Current Location'));
  expect(getMapUrl(screen).searchParams.get('marker')).toBe('0,0');
});

test('denied location permission displays an inline error and allows a successful retry', async () => {
  Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
  const screen = await render(<SellEnergyScreen navigation={{ navigate: jest.fn() }} />);

  expect(screen.getByRole('alert').props.children).toMatch(/Allow location access/);
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByText('Use My Current Location'));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(getMapUrl(screen).searchParams.get('marker')).toBe('7.2906,80.6337');
});

test('web maps still support initialRegion for other screens', async () => {
  const screen = await render(<MapView initialRegion={coordinates} />);
  expect(getMapUrl(screen).searchParams.get('marker')).toBe('7.2906,80.6337');
  expect(screen.getByText(/Tap a community seller/)).toBeTruthy();
});
