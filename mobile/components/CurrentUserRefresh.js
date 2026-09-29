import { useEffect } from 'react';
import { AppState } from 'react-native';
import { refreshCurrentUser } from '../services/currentUserService';
import { useAuthStore } from '../store/authStore';

export default function CurrentUserRefresh() {
  const userId = useAuthStore((state) => state.user?.id);
  useEffect(() => {
    if (!userId) return undefined;
    let pending = false;
    const refresh = async () => {
      if (pending || (AppState.currentState && AppState.currentState !== 'active')) return;
      pending = true;
      try { await refreshCurrentUser(); } catch { /* Backend still checks live permissions on every protected request. */ }
      finally { pending = false; }
    };
    void refresh();
    const timer = setInterval(refresh, 30000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [userId]);
  return null;
}
