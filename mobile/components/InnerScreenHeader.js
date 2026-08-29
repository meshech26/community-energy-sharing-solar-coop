import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function InnerScreenHeader({ back, navigation, options }) {
  const backLabel = options.backLabel || back?.title || 'Back';

  return (
    <View style={styles.header}>
      <View style={styles.content}>
        {back ? (
          <Pressable
            accessibilityLabel={`Back to ${backLabel}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <MaterialCommunityIcons color="#14633F" name="chevron-left" size={25} />
            <Text numberOfLines={1} style={styles.backLabel}>{backLabel}</Text>
          </Pressable>
        ) : null}
        <Text numberOfLines={1} style={styles.title}>{options.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#F7FAF7', borderBottomColor: '#E5ECE7', borderBottomWidth: 1 },
  content: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', maxWidth: 680, minHeight: 58, paddingHorizontal: 16, width: '100%' },
  backButton: { alignItems: 'center', borderRadius: 10, flexDirection: 'row', marginRight: 12, maxWidth: 150, minHeight: 44, paddingRight: 4 },
  backButtonPressed: { backgroundColor: '#EAF5EC' },
  backLabel: { color: '#14633F', fontSize: 14, fontWeight: '700', marginLeft: -3 },
  title: { color: '#173322', flex: 1, fontSize: 17, fontWeight: '800' },
});
