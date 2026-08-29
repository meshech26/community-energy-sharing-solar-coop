import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function ProposalSearchField({ onChangeText, value }) {
  const hasValue = value.trim().length > 0;

  return (
    <View style={styles.frame}>
      <MaterialCommunityIcons color="#627168" name="magnify" size={21} />
      <TextInput
        accessibilityLabel="Search proposals"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="Search proposals"
        placeholderTextColor="#87928C"
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {hasValue ? (
        <Pressable
          accessibilityLabel="Clear proposal search"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clearButton}
        >
          <MaterialCommunityIcons color="#587064" name="close-circle" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DF',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 18,
    minHeight: 52,
    paddingLeft: 14,
  },
  input: { color: '#17231C', flex: 1, fontSize: 16, minHeight: 50, paddingHorizontal: 10 },
  clearButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 46 },
});
