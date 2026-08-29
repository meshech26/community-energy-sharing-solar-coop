import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

export default function ConfirmationDialog({ cancelLabel = 'Cancel', children, confirmLabel = 'Confirm', destructive = false, isConfirming = false, onCancel, onConfirm, title, visible }) {
  return (
    <Modal animationType="fade" onRequestClose={isConfirming ? undefined : onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close confirmation" disabled={isConfirming} onPress={onCancel} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{children}</Text>
          <View style={styles.actions}>
            <View style={styles.action}><SecondaryButton disabled={isConfirming} onPress={onCancel}>{cancelLabel}</SecondaryButton></View>
            <View style={styles.action}><PrimaryButton loading={isConfirming} onPress={onConfirm} tone={destructive ? 'danger' : 'primary'}>{confirmLabel}</PrimaryButton></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(20, 40, 29, 0.42)', flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: '#FFFFFF', borderColor: '#E1EAE3', borderRadius: 18, borderWidth: 1, maxWidth: 460, padding: 22, width: '100%' },
  title: { color: '#173322', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  message: { color: '#526158', fontSize: 15, lineHeight: 23, marginBottom: 22 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
