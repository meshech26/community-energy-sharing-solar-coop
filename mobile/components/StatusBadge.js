import { StyleSheet, Text, View } from 'react-native';

const tones = {
  green: { backgroundColor: '#E2F3E9', borderColor: '#B6DDC5', color: '#14633F' },
  blue: { backgroundColor: '#E8F1FA', borderColor: '#BED6EF', color: '#245B87' },
  neutral: { backgroundColor: '#F1F4F2', borderColor: '#D8E0DA', color: '#526158' },
  warning: { backgroundColor: '#FFF4DE', borderColor: '#F4D89F', color: '#8A5A00' },
  danger: { backgroundColor: '#FCECED', borderColor: '#EEC1C5', color: '#A13F4A' },
};

export default function StatusBadge({ label, tone = 'neutral' }) {
  const colors = tones[tone] || tones.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}>
      <Text style={[styles.label, { color: colors.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  label: { fontSize: 12, fontWeight: '700' },
});
