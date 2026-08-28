import { StyleSheet, View } from 'react-native';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E1EAE3',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    boxShadow: '0px 6px 16px rgba(22, 74, 45, 0.06)',
    elevation: 2,
  },
});
