import api from '../services/api';
import { refreshCurrentUser } from '../services/currentUserService';
import { useAuthStore } from '../store/authStore';
jest.mock('../services/api', () => ({ get: jest.fn() }));
afterEach(() => { useAuthStore.getState().logout(); jest.clearAllMocks(); });
test('current user refresh updates permissions without replacing credentials', async () => {
  useAuthStore.getState().login({ id: 'member', isCoopAdmin: false }, 'existing-token');
  api.get.mockResolvedValue({ data: { user: { id: 'member', isCoopAdmin: true } } });
  await refreshCurrentUser();
  expect(useAuthStore.getState().user.isCoopAdmin).toBe(true);
  expect(useAuthStore.getState().token).toBe('existing-token');
});
test('late response cannot overwrite a different logged-in member', async () => {
  let resolve;
  api.get.mockImplementation(() => new Promise((done) => { resolve = done; }));
  useAuthStore.getState().login({ id: 'old' }, 'old-token');
  const pending = refreshCurrentUser();
  useAuthStore.getState().login({ id: 'new', isCoopAdmin: false }, 'new-token');
  resolve({ data: { user: { id: 'old', isCoopAdmin: true } } });
  await pending;
  expect(useAuthStore.getState().user).toEqual({ id: 'new', isCoopAdmin: false });
});
