import api from './api';
import { useAuthStore } from '../store/authStore';

export async function refreshCurrentUser() {
  const { token, user } = useAuthStore.getState();
  if (!token || !user?.id) return null;
  const response = await api.get('/auth/me', { timeout: 10000 });
  const current = useAuthStore.getState();
  if (current.token !== token || current.user?.id !== user.id) return null;
  current.updateUser(response.data.user);
  return response.data.user;
}
