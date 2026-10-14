import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

jest.mock('../services/api', () => ({ get: jest.fn(), post: jest.fn() }));

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  useAuthStore.getState().logout();
});

afterEach(async () => {
  await cleanup();
  useAuthStore.getState().logout();
});

const submitCredentials = async (view, email, password) => {
  await fireEvent.changeText(view.getByLabelText('Email'), email);
  await fireEvent.changeText(view.getByLabelText('Password'), password);
  await fireEvent.press(view.getByText('Sign In'));
};

test('signs in with the API token and current account details', async () => {
  const user = { id: 'resident', email: 'resident@example.test', name: 'Resident', isCoopAdmin: false };
  const currentUser = { ...user, name: 'Updated Resident', household: 'household-id' };
  api.post.mockResolvedValueOnce({ data: { token: 'server-token', user } });
  api.get.mockResolvedValueOnce({ data: { user: currentUser } });
  const view = await render(<LoginScreen navigation={{ navigate: jest.fn() }} />);

  await submitCredentials(view, ` ${user.email} `, 'AccountPassword123');

  expect(api.post).toHaveBeenCalledWith('/auth/login', {
    email: user.email,
    password: 'AccountPassword123',
  });
  expect(api.get).toHaveBeenCalledWith('/auth/me', {
    headers: { Authorization: 'Bearer server-token' },
  });
  await waitFor(() => expect(useAuthStore.getState()).toMatchObject({
    user: currentUser,
    token: 'server-token',
    isAuthenticated: true,
  }));
});

test.each([
  ['connection failure', new Error('Network Error'), 'Unable to reach Solar Share. Check your connection and try again.'],
  ['server failure', { response: { status: 503, data: {} } }, 'We could not sign you in. Please try again.'],
])('a former preset email stays signed out after %s', async (_, requestError, expectedMessage) => {
  api.post.mockRejectedValueOnce(requestError);
  const view = await render(<LoginScreen navigation={{ navigate: jest.fn() }} />);

  await submitCredentials(view, 'admin@solarcoop.com', 'password123');

  expect(await view.findByText(expectedMessage)).toBeTruthy();
  expect(api.get).not.toHaveBeenCalled();
  expect(useAuthStore.getState()).toMatchObject({
    user: null,
    token: null,
    isAuthenticated: false,
  });
});
