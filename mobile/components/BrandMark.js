import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

export default function BrandMark({ size = 44, style }) {
  const iconSize = Math.round(size * 0.52);

  return (
    <View accessible={false} style={[styles.mark, { borderRadius: Math.round(size * 0.28), height: size, width: size }, style]}>
      <MaterialCommunityIcons color="#FFFFFF" name="solar-power-variant-outline" size={iconSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    backgroundColor: '#16764C',
    justifyContent: 'center',
  },
});
