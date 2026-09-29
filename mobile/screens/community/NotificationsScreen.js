import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/community/CommunityUI';
import ScreenContainer from '../../components/ScreenContainer';
import { SectionHeader, screenSpacing } from '../../components/community/CommunityUI';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import SecondaryButton from '../../components/SecondaryButton';
import { useNotifications } from '../../components/community/NotificationProvider';
import { listNotifications } from '../../services/notificationService';
import { getCommunityError } from '../../utils/community';

export default function NotificationsScreen() {
  const { open, refresh, enable, openError, permission, revision } = useNotifications();
  const userId = useAuthStore((state) => state.user?.id);
  const request = useRef(0);
  const pages = useRef(1);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const load = useCallback(async (nextPage = 1, reload = false) => {
    const sequence = ++request.current;
    setLoading(true); setError('');
    try {
      let data; const collected = [];
      for (let index = reload ? 1 : nextPage; index <= nextPage; index += 1) {
        data = await listNotifications(index);
        collected.push(...data.notifications);
        if (!data.hasMore) { nextPage = index; break; }
      }
      if (sequence !== request.current) return;
      setItems((previous) => [...new Map([...(reload || nextPage === 1 ? [] : previous), ...collected].map((item) => [item.id, item])).values()]);
      setHasMore(data.hasMore); setPage(nextPage); pages.current = nextPage;
    } catch (requestError) { if (sequence === request.current) setError(getCommunityError(requestError, 'Unable to load notifications.')); }
    finally { if (sequence === request.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    setItems([]); pages.current = 1; void load();
    return () => { request.current += 1; };
  }, [load, userId]));
  useFocusEffect(useCallback(() => { if (revision) void load(pages.current, true); }, [load, revision]));
  const manualRefresh = () => { void load(pages.current, true); void refresh(); };
  return <ScreenContainer edges={['left', 'right']}><ScrollView contentContainerStyle={styles.page}
    refreshControl={<RefreshControl testID="notification-pull-refresh" refreshing={loading && items.length > 0} onRefresh={manualRefresh} tintColor="#16764C" colors={['#16764C']} />}>
    <SectionHeader title="Notifications" />
    {Platform.OS !== 'web' && ['not-granted', 'denied'].includes(permission) ? <Card style={styles.permission}>
      <Text style={styles.permissionTitle}>Stay updated</Text>
      <Text style={styles.message}>Enable phone notifications to receive proposal updates and voting reminders.</Text>
      {permission === 'denied' ? <Text accessibilityLiveRegion="polite" style={styles.note}>Permission was not granted. You can still read updates here, or enable notifications in your phone settings.</Text> :
        <Pressable accessibilityRole="button" accessibilityLabel="Enable notifications" accessibilityState={{ disabled: requesting, busy: requesting }} disabled={requesting} style={styles.mark} onPress={async () => {
          if (requesting) return; setRequesting(true);
          try { await enable(); } finally { setRequesting(false); }
        }}><Text style={styles.link}>{requesting ? 'Enabling…' : 'Enable notifications'}</Text></Pressable>}
    </Card> : null}
    {error || openError ? <ErrorMessage>{error || openError}</ErrorMessage> : null}
    {loading && !items.length ? <LoadingState label="Loading notifications…" /> : null}
    {!loading && !error && !items.length ? <EmptyState icon="bell-outline" title="No notifications yet" description="New proposals and voting reminders will appear here." /> : null}
    {items.map((item) => <Pressable key={item.id} style={styles.card} accessibilityRole="button" accessibilityLabel={`${item.isRead ? 'Read' : 'Unread'} notification: ${item.title}`} accessibilityValue={{ text: `${item.message}. ${new Date(item.createdAt).toLocaleString()}` }} onPress={() => open(item.id, () => {
      setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
    })}>
      <Card style={[styles.cardContent, !item.isRead && styles.unread]}>
        {!item.isRead ? <Text accessible={false} style={styles.state}>●</Text> : null}
        <Text style={[styles.title, item.isRead && styles.readTitle]}>{item.title}</Text><Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</Text>
      </Card>
    </Pressable>)}
    {hasMore && !loading ? <SecondaryButton onPress={() => load(page + 1)}>Load more</SecondaryButton> : null}
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, ...screenSpacing },
  cardContent: { padding: 16, borderWidth: 1, borderColor: '#DDE5DF', borderLeftWidth: 1, borderLeftColor: '#DDE5DF' },
  timestamp: { color: '#627168', fontSize: 12, lineHeight: 18, marginTop: 8 },
  permission: { padding: 16, marginBottom: 4, backgroundColor: '#F0F7F2' },
  permissionTitle: { color: '#173322', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  readTitle: { fontWeight: '600' },
  card: { marginTop: 12 }, unread: { borderLeftWidth: 4, borderLeftColor: '#16764C', backgroundColor: '#F5FAF6' },
  state: { color: '#16764C', fontSize: 10, marginBottom: 6 },
  title: { color: '#173322', fontSize: 16, fontWeight: '700', marginBottom: 7 },
  message: { color: '#627168', fontSize: 15, lineHeight: 22 },
  note: { color: '#627168', fontSize: 13, lineHeight: 20, marginVertical: 12 },
  link: { color: '#14633F', fontSize: 14, fontWeight: '700' },
  mark: { minHeight: 44, justifyContent: 'center', marginTop: 8 },
});
