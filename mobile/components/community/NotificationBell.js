import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNotifications } from './NotificationProvider';

export default function NotificationBell({ onPress }) {
  const { unreadCount } = useNotifications();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unreadCount} unread`} onPress={onPress} style={styles.button}>
    <MaterialCommunityIcons accessible={false} name="bell-outline" size={22} color="#14633F" />
    {unreadCount > 0 ? <Text style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</Text> : null}
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', width: 48, height: 48, marginBottom: 12 },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 20, minHeight: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: '#16764C', color: '#FFFFFF', textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: '700' },
});
