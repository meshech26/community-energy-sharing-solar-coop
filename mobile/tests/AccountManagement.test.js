import { act, cleanup, fireEvent, render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Linking } from 'react-native';
import App from '../App';
import AppHeader from '../components/AppHeader';
import { ForgotPasswordScreen, ResetPasswordScreen, ChangePasswordScreen, MyAccountScreen } from '../screens/account/AccountScreens';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
jest.mock('../services/api', () => ({ get: jest.fn(), post: jest.fn() }));
const user = { id: 'resident', name: 'Resident', email: 'resident@example.test', household: 'household', householdName: 'Lake View Household', isCoopAdmin: false };
const token = 'a'.repeat(64);
beforeEach(() => { jest.clearAllMocks(); useAuthStore.getState().logout(); api.get.mockResolvedValue({ data: { user } }); });
afterEach(async () => { await cleanup(); useAuthStore.getState().logout(); });
test('Login opens Forgot Password without changing registration navigation', async () => {
  const view = await render(<App />);
  await fireEvent.press(view.getByText('Forgot password?'));
  expect(await view.findByText('Send Reset Link')).toBeTruthy();
});
test('forgot submits email and shows generic success without any token', async () => {
  const generic = 'If an account exists for this email, a password reset link has been sent.';
  api.post.mockResolvedValue({ data: { message: generic } });
  const navigation = { navigate: jest.fn() };
  const view = await render(<ForgotPasswordScreen navigation={navigation} />);
  await fireEvent.changeText(view.getByLabelText('Email'), ' resident@example.test ');
  await fireEvent.press(view.getByText('Send Reset Link'));
  expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: user.email });
  expect(await view.findByText(generic)).toBeTruthy();
  await fireEvent.press(view.getByText('Sign in'));
  expect(navigation.navigate).toHaveBeenCalledWith('Login');
});
test('valid reset link opens Reset Password from cold start', async () => {
  const original = Linking.getInitialURL;
  Linking.getInitialURL = jest.fn().mockResolvedValue(`http://localhost/#reset-password/${token}`);
  try { const view = await render(<App />); expect(await view.findByText('Reset Password')).toBeTruthy(); }
  finally { Linking.getInitialURL = original; }
});
test('reset validates passwords, securely submits token and returns to Login on success', async () => {
  api.post.mockResolvedValue({ data: {} });
  const navigation = { navigate: jest.fn() };
  const view = await render(<ResetPasswordScreen route={{ params: { token } }} navigation={navigation} />);
  expect(view.getByLabelText('New password').props.secureTextEntry).toBe(true);
  await fireEvent.changeText(view.getByLabelText('New password'), 'NewPassword123');
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'mismatch');
  await fireEvent.press(view.getByText('Reset Password'));
  expect(view.getByText('Passwords do not match.')).toBeTruthy(); expect(api.post).not.toHaveBeenCalled();
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'NewPassword123');
  await fireEvent.press(view.getByText('Reset Password'));
  expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token, newPassword: 'NewPassword123', confirmPassword: 'NewPassword123' });
  expect(await view.findByText('Your password has been changed successfully.')).toBeTruthy();
  expect(view.getByRole('header', { name: 'Password updated' })).toBeTruthy();
  expect(view.getAllByRole('button')).toHaveLength(1);
  expect(view.getByRole('button', { name: 'Sign in' })).toHaveStyle({ borderColor: '#BFD5C6', borderWidth: 1, minHeight: 52 });
  await fireEvent.press(view.getByText('Sign in')); expect(navigation.navigate).toHaveBeenCalledWith('Login');
});
test('invalid or expired reset offers a new request', async () => {
  api.post.mockRejectedValue({ response: { data: { message: 'This password reset link is invalid or has expired.' } } });
  const navigation = { navigate: jest.fn() };
  const view = await render(<ResetPasswordScreen route={{ params: { token } }} navigation={navigation} />);
  await fireEvent.changeText(view.getByLabelText('New password'), 'NewPassword123');
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'NewPassword123');
  await fireEvent.press(view.getByText('Reset Password'));
  await fireEvent.press(await view.findByText('Request a new reset')); expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword');
});
test('change password requires current password and uses the authenticated endpoint', async () => {
  api.post.mockResolvedValue({ data: {} });
  const view = await render(<ChangePasswordScreen navigation={{ navigate: jest.fn() }} />);
  await fireEvent.press(view.getByText('Update Password'));
  expect(view.getByText('Enter your current password.')).toBeTruthy();
  await fireEvent.changeText(view.getByLabelText('Current password'), 'Original123');
  await fireEvent.changeText(view.getByLabelText('New password'), 'Changed123');
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'Changed123');
  await fireEvent.press(view.getByText('Update Password'));
  expect(api.post).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'Original123', newPassword: 'Changed123', confirmPassword: 'Changed123' });
  expect(await view.findByText('Your password has been changed successfully.')).toBeTruthy();
});
test('account shows read-only current data, live role, change navigation and existing logout', async () => {
  useAuthStore.getState().login(user, 'existing-token');
  const navigation = { navigate: jest.fn() };
  const view = await render(<NavigationContainer><MyAccountScreen navigation={navigation} /></NavigationContainer>);
  expect(await view.findByText('Lake View Household')).toBeTruthy();
  expect(view.getByText(user.name)).toBeTruthy(); expect(view.getByText(user.email)).toBeTruthy();
  expect(view.getByText('Household Member')).toBeTruthy();
  await act(async () => useAuthStore.getState().updateUser({ ...user, isCoopAdmin: true }));
  expect(view.getByText('Household Member + Co-op Admin')).toBeTruthy();
  expect(view.getByText('Membership')).toBeTruthy();
  expect(view.queryByText('Role')).toBeNull();
  expect(view.queryByText('Co-op Administrator')).toBeNull();
  expect(useAuthStore.getState().user.isCoopAdmin).toBe(true);
  await fireEvent.press(view.getByText('Change Password')); expect(navigation.navigate).toHaveBeenCalledWith('ChangePassword');
  await fireEvent.press(view.getByText('Log Out')); expect(useAuthStore.getState().isAuthenticated).toBe(false);
});
test('membership and existing admin badge require the literal true permission', async () => {
  useAuthStore.getState().login(user, 'existing-token');
  const view = await render(<NavigationContainer><AppHeader /><MyAccountScreen navigation={{ navigate: jest.fn() }} /></NavigationContainer>);
  await view.findByText('Lake View Household');
  for (const permission of [false, undefined, 'true', 1, true, false]) {
    await act(async () => useAuthStore.getState().updateUser({ ...user, isCoopAdmin: permission }));
    expect(view.getByText(permission === true ? 'Household Member + Co-op Admin' : 'Household Member')).toBeTruthy();
    expect(Boolean(view.queryByTestId('coop-admin-badge'))).toBe(permission === true);
    expect(view.queryByText('Role')).toBeNull();
  }
});
test('change password starts empty and masked, with independent labelled visibility controls', async () => {
  const view = await render(<ChangePasswordScreen navigation={{ navigate: jest.fn() }} />);
  for (const label of ['Current password', 'New password', 'Confirm new password']) {
    expect(view.getByLabelText(label).props.value).toBe('');
    expect(view.getByLabelText(label).props.secureTextEntry).toBe(true);
    await fireEvent.changeText(view.getByLabelText(label), `Typed ${label}`);
    await fireEvent.press(view.getByRole('button', { name: `Show ${label.toLowerCase()}` }));
    expect(view.getByLabelText(label).props.secureTextEntry).toBe(false);
    expect(view.getByLabelText(label).props.value).toBe(`Typed ${label}`);
    await fireEvent.press(view.getByRole('button', { name: `Hide ${label.toLowerCase()}` }));
    expect(view.getByLabelText(label).props.secureTextEntry).toBe(true);
  }
  expect(api.get).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
});
test('change password retains length and confirmation validation and announces success', async () => {
  api.post.mockResolvedValue({ data: {} });
  const navigation = { navigate: jest.fn() };
  const view = await render(<ChangePasswordScreen navigation={navigation} />);
  await fireEvent.changeText(view.getByLabelText('Current password'), 'Original123');
  await fireEvent.changeText(view.getByLabelText('New password'), 'short');
  await fireEvent.press(view.getByText('Update Password'));
  expect(view.getByText('Password must be at least 8 characters long.')).toBeTruthy();
  await fireEvent.changeText(view.getByLabelText('New password'), 'Changed123');
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'Mismatch123');
  await fireEvent.press(view.getByText('Update Password'));
  expect(view.getByText('Passwords do not match.')).toBeTruthy();
  expect(api.post).not.toHaveBeenCalled();
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'Changed123');
  await fireEvent.press(view.getByText('Update Password'));
  expect((await view.findByText('Your password has been changed successfully.')).props.accessibilityLiveRegion).toBe('polite');
  expect(view.queryByLabelText('Current password')).toBeNull();
  await fireEvent.press(view.getByText('Return to account'));
  expect(navigation.navigate).toHaveBeenCalledWith('MyAccount');
});
test('header account entry reaches My Account without adding a bottom tab', async () => {
  useAuthStore.getState().login(user, 'existing-token');
  const view = await render(<App />);
  await fireEvent.press(view.getByLabelText('My Account'));
  expect(await view.findByText('Lake View Household')).toBeTruthy();
}, 15000);
