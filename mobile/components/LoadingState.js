import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LoadingState({ label = 'Loading…' }) {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color="#16764C" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', padding: 20 },
  label: { color: '#627168', fontSize: 15, fontWeight: '600' },
});
