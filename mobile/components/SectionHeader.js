import { StyleSheet, Text, View } from 'react-native';

export default function SectionHeader({ description, eyebrow, title }) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  eyebrow: { color: '#16764C', fontSize: 12, fontWeight: '800', letterSpacing: 0.9, marginBottom: 8 },
  title: { color: '#173322', fontSize: 30, fontWeight: '800', letterSpacing: -0.35, lineHeight: 36 },
  description: { color: '#627168', fontSize: 16, lineHeight: 24, marginTop: 8 },
});
