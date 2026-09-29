import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { listNotifications, markNotificationRead } from '../../services/notificationService';
import { createDeviceNotifications } from '../../services/deviceNotifications';
import { useAuthStore } from '../../store/authStore';
import { getCommunityError } from '../../utils/community';

const NotificationContext = createContext({ unreadCount: 0, refresh: async () => {}, open: async () => {}, enable: async () => 'unavailable' });
export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({ children, navigation }) {
  const userId = useAuthStore((state) => state.user?.id);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openError, setOpenError] = useState('');
  const [revision, setRevision] = useState(0);
  const [permission, setPermission] = useState('unavailable');
  const device = useRef(null);
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const refreshing = useRef(false);
  const refresh = useCallback(async () => {
    if (!userId || refreshing.current) return;
    refreshing.current = true;
    try {
      const data = await listNotifications();
      if (currentUser.current !== userId) return;
      setUnreadCount(data.unreadCount);
      setRevision((value) => value + 1);
      await device.current?.sync(data.notifications);
    } catch { /* Inbox offers a visible retry; background polling stays quiet. */ }
    finally { refreshing.current = false; }
  }, [userId]);
  const open = useCallback(async (id, onRead) => {
    setOpenError('');
    try {
      const item = await markNotificationRead(id);
      if (currentUser.current !== userId) return;
      onRead?.(item);
      await refresh();
      if (item.proposalId) navigation.navigate('ProposalDetails', { proposalId: item.proposalId });
      else if (item.transferRequestId) navigation.navigate('AdminTransferRequest', { transferRequestId: item.transferRequestId });
    } catch (error) {
      if (currentUser.current !== userId) return;
      setOpenError(getCommunityError(error, 'Unable to open notification. Please try again.'));
      navigation.navigate('Notifications');
    }
  }, [navigation, refresh, userId]);
  useEffect(() => {
    let stopped = false;
    currentUser.current = userId;
    setUnreadCount(0);
    setPermission('unavailable');
    setOpenError('');
    if (!userId) return undefined;
    void createDeviceNotifications(userId, open).then((manager) => {
      if (stopped) manager?.dispose();
      else {
        device.current = manager;
        void manager?.permissionState().then((state) => { if (!stopped) setPermission(state); }).catch(() => { if (!stopped) setPermission('unavailable'); });
        void refresh();
      }
    });
    const tick = () => { if (!AppState.currentState || AppState.currentState === 'active') void refresh(); };
    tick();
    const timer = setInterval(tick, 30000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tick();
        void device.current?.permissionState().then((value) => { if (!stopped) setPermission(value); }).catch(() => {});
      }
    });
    return () => { stopped = true; currentUser.current = null; clearInterval(timer); subscription.remove(); device.current?.dispose(); device.current = null; };
  }, [userId, open, refresh]);
  const enable = async () => {
    try {
      if (!device.current) return 'unavailable';
      const granted = await device.current.enable();
      if (currentUser.current !== userId) return 'unavailable';
      setPermission(granted ? 'enabled' : 'denied');
      if (granted) await refresh();
      return granted ? 'enabled' : 'denied';
    } catch { setPermission('unavailable'); return 'unavailable'; }
  };
  return <NotificationContext.Provider value={{ unreadCount, refresh, open, enable, openError, revision, permission }}>{children}</NotificationContext.Provider>;
}
