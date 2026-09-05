import { registerRootComponent } from 'expo';
import { StyleSheet, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.setProperty('--css-interop-darkMode', 'class dark');
  if (StyleSheet.setFlag) {
    StyleSheet.setFlag('darkMode', 'class');
  }
}

import App from './App';

registerRootComponent(App);
