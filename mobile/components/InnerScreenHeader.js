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
            <MaterialCommunityIcons accessible={false} color="#14633F" name="chevron-left" size={25} />
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" style={styles.title}>{options.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#F7FAF7', borderBottomColor: '#E5ECE7', borderBottomWidth: 1 },
  content: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, maxWidth: 680, minHeight: 58, paddingHorizontal: 16, paddingVertical: 8, width: '100%' },
  backButton: { alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginRight: 8, minWidth: 44, minHeight: 44 },
  backButtonPressed: { backgroundColor: '#EAF5EC' },
  title: { color: '#173322', flexGrow: 1, flexShrink: 1, flexBasis: 160, fontSize: 17, fontWeight: '700' },
});
