import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function PrimaryButton({ children, disabled = false, icon, loading = false, onPress, testID, tone = 'primary', pressedColor }) {
  const isDisabled = disabled || loading;
  const foreground = isDisabled ? '#526158' : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'danger' && styles.buttonDanger,
        pressed && !isDisabled && (tone === 'danger' ? styles.buttonDangerPressed : styles.buttonPressed),
        tone === 'administrator' && styles.buttonAdministrator,
        tone === 'administrator' && pressed && !isDisabled && styles.buttonAdministratorPressed,
        tone === 'household' && styles.buttonHousehold,
        isDisabled && styles.buttonDisabled,
        tone === 'household' && pressed && !isDisabled && styles.buttonHouseholdPressed,
        pressed && !isDisabled && pressedColor && { backgroundColor: pressedColor },
      ]}
      testID={testID}
    >
      {loading || icon ? <View style={styles.labelRow}>
        {loading ? <ActivityIndicator accessible={false} color={foreground} /> : icon ? <MaterialCommunityIcons accessible={false} color={foreground} name={icon} size={18} /> : null}
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{children}</Text>
      </View> : <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{children}</Text>}
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
    paddingVertical: 12,
    maxWidth: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#E5EBE7',
  },
  buttonDanger: { backgroundColor: '#B14B56' },
  buttonHousehold: { backgroundColor: '#6A5D9F' },
  buttonHouseholdPressed: { backgroundColor: '#554A82' },
  buttonAdministrator: { backgroundColor: '#356FA3' },
  buttonAdministratorPressed: { backgroundColor: '#295982' },
  labelDisabled: { color: '#526158' },
  buttonDangerPressed: { backgroundColor: '#913B46' },
  buttonPressed: {
    backgroundColor: '#105D3B',
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 7, maxWidth: '100%' },
});
