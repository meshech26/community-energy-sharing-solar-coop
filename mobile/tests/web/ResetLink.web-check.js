import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Linking } from 'react-native';
import AppNavigator from '../../navigation/AppNavigator';
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../../store/authStore', () => ({ useAuthStore: (select) => select({ isAuthenticated: false }) }));
jest.mock('../../components/AppHeader', () => () => null);
jest.mock('../../components/CurrentUserRefresh', () => () => null);
jest.mock('../../components/community/NotificationProvider', () => () => null);
jest.mock('../../navigation/CommunityNavigator', () => () => null);
jest.mock('../../navigation/NavigationFocusLayout', () => ({ children }) => children);
jest.mock('../../screens/LoginScreen', () => () => <div>Login fixture</div>);
jest.mock('../../screens/account/AccountScreens', () => ({
  ForgotPasswordScreen: () => <div>Forgot fixture</div>,
  ResetPasswordScreen: ({ route, navigation }) => <div>Reset fixture: {route.params?.token}<button onClick={() => navigation.navigate('Login')}>Return to login</button></div>,
}));
jest.mock('../../screens/DashboardScreen', () => () => null);
jest.mock('../../screens/MarketplaceScreen', () => () => null);
jest.mock('../../screens/MyImpactScreen', () => () => null);
jest.mock('../../screens/ListingDetailsScreen', () => () => null);
jest.mock('../../screens/ReviewListingScreen', () => () => null);
jest.mock('../../screens/MyListingsScreen', () => () => null);
jest.mock('../../screens/OrderSummaryScreen', () => () => null);
jest.mock('../../screens/PaymentScreen', () => () => null);
jest.mock('../../screens/PaymentSuccessScreen', () => () => null);
jest.mock('../../screens/SellEnergyScreen', () => () => null);
jest.mock('../../screens/SellSuccessScreen', () => () => null);
jest.mock('../../screens/TransactionHistoryScreen', () => () => null);
jest.mock('../../screens/AdminApprovalsScreen', () => () => null);
jest.mock('../../screens/MessagesScreen', () => () => null);
jest.mock('../../screens/NewMessageScreen', () => () => null);
jest.mock('../../screens/ChatScreen', () => () => null);
jest.mock('../../screens/RegisterScreen', () => () => null);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no layout observer; navigation uses it to measure screen frames.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
let root, container;
const token = 'a'.repeat(64);
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove(); jest.restoreAllMocks(); window.history.replaceState(null, '', '/');
});
const renderNavigator = async () => {
  await act(async () => root.render(<AppNavigator />));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
};
test('email hash overrides real web root Login state and return to Login works', async () => {
  window.history.replaceState(null, '', '/#reset-password/' + token);
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(window.location.href);
  await renderNavigator();
  expect(container.textContent).toContain('Reset fixture: ' + token);
  await act(async () => container.querySelector('button').click());
  expect(container.textContent).toContain('Login fixture');
});
test('normal root login remains unchanged; new hash opens reset in the running app', async () => {
  window.history.replaceState(null, '', '/');
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(window.location.href);
  await renderNavigator();
  expect(container.textContent).toContain('Login fixture');
  await act(async () => {
    window.history.replaceState(null, '', '/#reset-password/' + token);
    window.dispatchEvent(new Event('hashchange'));
  });
  expect(container.textContent).toContain('Reset fixture: ' + token);
});

