import "./global.css";
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import SustainabilityStack from './navigation/SustainabilityStack';

export default function App() {
  return (
    <NavigationContainer>
      <SustainabilityStack />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}