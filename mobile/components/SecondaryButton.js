import { Pressable, StyleSheet, Text } from 'react-native';

export default function SecondaryButton({ children, disabled = false, onPress, testID }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && !disabled && styles.buttonPressed]}
      testID={testID}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderColor: '#BFD5C6', borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: 20 },
  buttonDisabled: { borderColor: '#DDE5DF' },
  buttonPressed: { backgroundColor: '#EDF6EF' },
  label: { color: '#14633F', fontSize: 16, fontWeight: '700' },
  labelDisabled: { color: '#93A198' },
});
