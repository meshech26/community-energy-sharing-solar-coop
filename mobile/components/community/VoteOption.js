import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const labels = { yes: 'Yes', no: 'No', abstain: 'Abstain' };
const choiceStyles = {
  yes: { accent: '#16764C', background: '#EDF7F0', border: '#74B998', label: '#14633F' },
  no: { accent: '#B14B56', background: '#FDF0F1', border: '#E8B0B7', label: '#9B3E49' },
  abstain: { accent: '#9A690F', background: '#FFF7E9', border: '#E8CF9B', label: '#7B560B' },
};

export default function VoteOption({ choice, onPress, selected }) {
  const colors = choiceStyles[choice];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Vote ${labels[choice]}`}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected && { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.optionPressed]}
    >
      <View style={[styles.radio, selected && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
        {selected ? <MaterialCommunityIcons color="#FFFFFF" name="check" size={16} /> : null}
      </View>
      <Text style={[styles.label, selected && { color: colors.label }]}>{labels[choice]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#DDE5DF', borderRadius: 14, borderWidth: 1, flexDirection: 'row', marginBottom: 12, minHeight: 58, paddingHorizontal: 16 },
  optionPressed: { opacity: 0.78 },
  radio: { alignItems: 'center', borderColor: '#9CAAA1', borderRadius: 12, borderWidth: 1, height: 24, justifyContent: 'center', marginRight: 12, width: 24 },
  label: { color: '#29352F', fontSize: 16, fontWeight: '700' },
});
