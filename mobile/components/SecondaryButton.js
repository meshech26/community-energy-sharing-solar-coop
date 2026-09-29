import { Pressable, StyleSheet, Text } from 'react-native';

export default function SecondaryButton({ children, disabled = false, onPress, testID, tone = 'primary' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, tone === 'household' && styles.household, disabled && styles.buttonDisabled, pressed && !disabled && (tone === 'household' ? styles.householdPressed : styles.buttonPressed)]}
      testID={testID}
    >
      <Text style={[styles.label, tone === 'household' && styles.householdLabel, disabled && styles.labelDisabled]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderColor: '#BFD5C6', borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: 20, paddingVertical: 12, maxWidth: '100%' },
  buttonDisabled: { borderColor: '#C8D2CB', backgroundColor: '#E5EBE7' },
  household: { borderColor: '#6A5D9F', backgroundColor: '#FFFFFF' },
  householdPressed: { backgroundColor: '#F2EFF8' },
  householdLabel: { color: '#554A82' },
  buttonPressed: { backgroundColor: '#EDF6EF' },
  label: { color: '#14633F', fontSize: 16, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  labelDisabled: { color: '#526158' },
});
