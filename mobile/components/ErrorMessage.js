import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function ErrorMessage({ children }) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <MaterialCommunityIcons color="#A42A2A" name="alert-circle-outline" size={20} />
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F0',
    borderColor: '#FFD5D5',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    padding: 12,
  },
  text: { color: '#A42A2A', flex: 1, fontSize: 14, lineHeight: 20 },
});
