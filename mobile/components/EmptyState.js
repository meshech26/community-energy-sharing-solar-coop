import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import Card from './Card';

export default function EmptyState({ description, icon = 'leaf-circle-outline', title }) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons color="#16764C" name={icon} size={29} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'flex-start', padding: 20 },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E7F4EB',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    marginBottom: 16,
    width: 54,
  },
  title: { color: '#173322', fontSize: 18, fontWeight: '800', lineHeight: 23, marginBottom: 6 },
  description: { color: '#627168', fontSize: 16, lineHeight: 24 },
});
