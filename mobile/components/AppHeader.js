import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import BrandMark from './BrandMark';
import RoleBadge from './RoleBadge';
import { useAuthStore } from '../store/authStore';

export default function AppHeader() {
  const { logout, user } = useAuthStore();
  const firstName = user?.name?.trim().split(' ')[0] || 'Member';

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.brandRow}>
          <BrandMark size={40} style={styles.brandIcon} />
          <View style={styles.identity}>
            <Text style={styles.brand}>Solar Share</Text>
            <Text numberOfLines={1} style={styles.greeting}>Hello, {firstName}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {user?.isCoopAdmin === true ? <RoleBadge /> : null}
          <Pressable accessibilityLabel="Log out" accessibilityRole="button" hitSlop={8} onPress={logout} style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}>
            <MaterialCommunityIcons color="#31523E" name="logout-variant" size={21} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5ECE7',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerContent: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 680,
    minHeight: 68,
    paddingHorizontal: 20,
    width: '100%',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  brandIcon: {
    marginRight: 10,
  },
  identity: {
    flexShrink: 1,
  },
  brand: {
    color: '#173322',
    fontSize: 18,
    fontWeight: '800',
  },
  greeting: {
    color: '#6A776E',
    fontSize: 13,
    marginTop: 1,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginLeft: 12,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#F2F7F3',
    borderRadius: 17,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  logoutButtonPressed: {
    backgroundColor: '#E2EDE5',
  },
});
