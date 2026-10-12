import { StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from './StripeWrapper';
import AppNavigator from './navigation/AppNavigator';
import './global.css';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.setProperty('--css-interop-darkMode', 'class dark');
  if (StyleSheet.setFlag) {
    StyleSheet.setFlag('darkMode', 'class');
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey="pk_test_dummy">
        <StatusBar style="dark" />
        <AppNavigator />
      </StripeProvider>
    </SafeAreaProvider>
  );
}
