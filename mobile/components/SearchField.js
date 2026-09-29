import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SearchField({ value, onChangeText, label, clearLabel, accentColor = '#16764C', style }) {
  const [focused, setFocused] = useState(false);
  return <View style={style}><Text style={styles.label}>{label}</Text><View style={[styles.frame, focused && { borderColor: accentColor }]}>
    <MaterialCommunityIcons accessible={false} color="#627168" name="magnify" size={20} />
    <TextInput accessibilityLabel={label} placeholder={label} placeholderTextColor="#627168" value={value} onChangeText={onChangeText} autoCapitalize="none" autoCorrect={false} returnKeyType="search" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.input} />
    {value.length > 0 ? <Pressable accessibilityLabel={clearLabel} accessibilityRole="button" onPress={() => onChangeText('')} style={styles.clear}><MaterialCommunityIcons accessible={false} color="#627168" name="close-circle" size={20} /></Pressable> : null}
  </View></View>;
}
const styles = StyleSheet.create({
  label: { color: '#526158', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  frame: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE5DF', borderRadius: 12, minHeight: 48, paddingLeft: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 48, padding: 12, fontSize: 14, color: '#29332E' },
  clear: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
