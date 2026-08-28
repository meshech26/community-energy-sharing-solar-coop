import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

export default function ScreenContainer({ children, edges = ['top', 'right', 'bottom', 'left'], style }) {
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      <View style={styles.contentFrame}>
        <View style={[styles.content, style]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F7FAF7',
    flex: 1,
  },
  contentFrame: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 680,
    width: '100%',
  },
  content: {
    flex: 1,
  },
});
