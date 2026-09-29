import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Modal from './AccessibleModal';

import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

export default function ConfirmationDialog({ cancelLabel = 'Cancel', children, confirmLabel = 'Confirm', confirmTone = 'primary', destructive = false, isConfirming = false, onCancel, onConfirm, title, visible }) {
  // Remove closing content immediately: callers clear their action state on close,
  // which would otherwise flash fallback labels during the Modal fade-out.
  if (!visible) return null;

  return (
    <Modal accessibilityLabel={title} animationType="fade" onRequestClose={isConfirming ? undefined : onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessible={false} focusable={false} tabIndex={-1} importantForAccessibility="no" disabled={isConfirming} onPress={onCancel} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.dialog}>
          <ScrollView testID="confirmation-scroll" contentContainerStyle={styles.dialogContent}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{children}</Text>
          <View style={styles.actions}>
            <View style={styles.action}><SecondaryButton disabled={isConfirming} onPress={onCancel}>{cancelLabel}</SecondaryButton></View>
            <View style={styles.action}><PrimaryButton loading={isConfirming} onPress={onConfirm} tone={destructive ? 'danger' : confirmTone}>{confirmLabel}</PrimaryButton></View>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(20, 40, 29, 0.42)', flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: '#FFFFFF', borderColor: '#E1EAE3', borderRadius: 18, borderWidth: 1, maxWidth: 460, maxHeight: '100%', width: '100%' },
  dialogContent: { padding: 22 },
  title: { color: '#173322', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  message: { color: '#526158', fontSize: 15, lineHeight: 23, marginBottom: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { flexGrow: 1, flexShrink: 1, flexBasis: 150 },
});
