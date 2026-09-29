import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const labels = { yes: 'Yes', no: 'No', abstain: 'Abstain' };
const choiceStyles = {
  yes: { accent: '#1F8A5B', background: '#EDF7F0', border: '#BFE3CE', label: '#14633F' },
  no: { accent: '#C6535D', background: '#FDF0F1', border: '#EFC3C7', label: '#9B3E49' },
  abstain: { accent: '#C68A1A', background: '#FFF7E9', border: '#EED9A7', label: '#7B560B' },
};

export default function VoteOption({ choice, onPress, selected }) {
  const colors = choiceStyles[choice];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={`Vote ${labels[choice]}`}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected && { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.optionPressed]}
    >
      <View style={[styles.radio, selected && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
        {selected ? <MaterialCommunityIcons accessible={false} color={choice === 'abstain' ? '#173322' : '#FFFFFF'} name="check" size={16} /> : null}
      </View>
      <Text style={[styles.label, selected && { color: colors.label }]}>{labels[choice]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#DDE5DF', borderRadius: 10, borderWidth: 1, flexDirection: 'row', marginBottom: 10, minHeight: 54, paddingHorizontal: 16, paddingVertical: 8 },
  optionPressed: { opacity: 0.78 },
  radio: { alignItems: 'center', borderColor: '#9CAAA1', borderRadius: 12, borderWidth: 1, height: 24, justifyContent: 'center', marginRight: 12, width: 24 },
  label: { color: '#29352F', fontSize: 16, fontWeight: '700', flexShrink: 1 },
});
