import { StyleSheet, Text, View } from 'react-native';

export default function RoleBadge() {
  return (
    <View accessibilityLabel="Co-op Admin" style={styles.badge} testID="coop-admin-badge">
      <Text style={styles.label}>Co-op Admin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#E2F3E9',
    borderColor: '#B6DDC5',
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    color: '#14633F',
    fontSize: 12,
    fontWeight: '700',
  },
});
