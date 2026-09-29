import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BaseCard from '../Card';

// Scoped to Community: other teams' screens and authentication keep their styles.
export function Card({ children, style }) {
  return <BaseCard style={[styles.card, style]}>{children}</BaseCard>;
}

export function SectionHeader({ description, eyebrow, title }) {
  return <View style={styles.heading}>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>;
}

export const screenSpacing = { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 };
export function DangerButton({ children, onPress, loading = false, disabled = false, icon = 'close-circle-outline' }) {
  const unavailable = disabled || loading;
  const color = unavailable ? '#526158' : '#B14B56';
  return <Pressable accessibilityRole="button" accessibilityLabel={typeof children === 'string' ? children : undefined} accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress}
    style={({ pressed }) => [styles.danger, pressed && !unavailable && { backgroundColor: '#FCECED' }, unavailable && { backgroundColor: '#E5EBE7', borderColor: '#C8D2CB' }]}>
    {loading ? <ActivityIndicator accessible={false} color={color} /> : <><MaterialCommunityIcons accessible={false} name={icon} size={18} color={color} /><Text style={[styles.dangerLabel, { color }]}>{children}</Text></>}
  </Pressable>;
}
const styles = StyleSheet.create({
  danger: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#EEC1C5', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dangerLabel: { color: '#B14B56', fontSize: 16, fontWeight: '600', flexShrink: 1 },
  card: { padding: 16, borderRadius: 12, boxShadow: '0px 2px 6px rgba(22, 74, 45, 0.03)', elevation: 1 },
  heading: { marginBottom: 20 },
  eyebrow: { color: '#14633F', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  title: { color: '#173322', fontSize: 26, fontWeight: '700', lineHeight: 32 },
  description: { color: '#627168', fontSize: 16, lineHeight: 23, marginTop: 8 },
});
