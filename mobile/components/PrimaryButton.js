import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function PrimaryButton({ children, disabled = false, icon, loading = false, onPress, testID, tone = 'primary' }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'danger' && styles.buttonDanger,
        isDisabled && (tone === 'danger' ? styles.buttonDangerDisabled : styles.buttonDisabled),
        pressed && !isDisabled && (tone === 'danger' ? styles.buttonDangerPressed : styles.buttonPressed),
      ]}
      testID={testID}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : icon ? <View style={styles.labelRow}><MaterialCommunityIcons color="#FFFFFF" name={icon} size={18} /><Text style={styles.label}>{children}</Text></View> : <Text style={styles.label}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#16764C',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    backgroundColor: '#8EB8A4',
  },
  buttonDanger: { backgroundColor: '#B14B56' },
  buttonDangerDisabled: { backgroundColor: '#C98B93' },
  buttonDangerPressed: { backgroundColor: '#913B46' },
  buttonPressed: {
    backgroundColor: '#105D3B',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
});
