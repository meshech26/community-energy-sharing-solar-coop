import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function VotePrivacyCallout({ compact = false }) {
  return (
    <View accessibilityRole="summary" style={[styles.callout, compact && styles.compact]}>
      <MaterialCommunityIcons accessibilityLabel="Private household vote" color="#14633F" name="shield-lock-outline" size={compact ? 20 : 23} />
      <View style={styles.copy}>
        <Text style={styles.title}>{compact ? 'Your household vote remains private.' : 'Your household vote is private.'}</Text>
        <Text style={styles.message}>{compact ? 'Only combined results are shown after voting closes.' : 'Individual voting choices are not shown to other members or the Co-op Administrator. Only combined results are shown after voting closes.'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  callout: { alignItems: 'flex-start', backgroundColor: '#EEF7F0', borderColor: '#C7E1CE', borderRadius: 14, borderWidth: 1, flexDirection: 'row', marginBottom: 18, padding: 14 },
  compact: { marginBottom: 18, padding: 12 },
  copy: { flex: 1, marginLeft: 10 },
  title: { color: '#173322', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  message: { color: '#526158', fontSize: 13, lineHeight: 19, marginTop: 3 },
});
