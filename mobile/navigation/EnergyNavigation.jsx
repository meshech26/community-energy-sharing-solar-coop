import React from 'react';
import { View, Text, Platform } from 'react-native';

// Dynamically check and load React Navigation.
// If the user's project does not have @react-navigation installed yet,
// we provide a clean, state-based tab/navigation fallback so the application runs perfectly without crashing!
let createStackNavigator = null;
try {
  createStackNavigator = require('@react-navigation/stack').createStackNavigator;
} catch (e) {
  console.warn('React Navigation packages not yet installed. A simulated navigation provider will be used.');
}

import EnergyDashboardScreen from '../screens/EnergyDashboardScreen';
import EnergyLimitScreen from '../screens/EnergyLimitScreen';
import AlertHistoryScreen from '../screens/AlertHistoryScreen';

// Use native navigation Stack on mobile platforms, and the stable simulated screen-router on web
if (createStackNavigator && Platform.OS !== 'web') {
  const Stack = createStackNavigator();

  /**
   * React Navigation stack linking Dashboard, Limits config, and Alerts list.
   */
  module.exports = function EnergyNavigation() {
    return (
      <Stack.Navigator
        initialRouteName="EnergyDashboard"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#1e293b',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShown: false,
        }}
      >
        <Stack.Screen name="EnergyDashboard" component={EnergyDashboardScreen} />
        <Stack.Screen name="EnergyLimit" component={EnergyLimitScreen} />
        <Stack.Screen name="AlertHistory" component={AlertHistoryScreen} />
      </Stack.Navigator>
    );
  };
} else {
  // Resilient navigation fallback using simple screen routing state
  module.exports = function EnergyNavigation() {
    const [currentRoute, setCurrentRoute] = React.useState('EnergyDashboard');
    const [history, setHistory] = React.useState([]);

    const navigate = (routeName) => {
      setHistory(prev => [...prev, currentRoute]);
      setCurrentRoute(routeName);
    };

    const goBack = () => {
      if (history.length > 0) {
        const prev = history[history.length - 1];
        setHistory(prevHistory => prevHistory.slice(0, -1));
        setCurrentRoute(prev);
      }
    };

    // Construct mock navigation prop to match standard React Navigation api
    const mockNavigation = {
      navigate,
      goBack,
    };

    return (
      <View className="flex-1">
        {currentRoute === 'EnergyDashboard' && (
          <EnergyDashboardScreen navigation={mockNavigation} />
        )}
        {currentRoute === 'EnergyLimit' && (
          <EnergyLimitScreen navigation={mockNavigation} />
        )}
        {currentRoute === 'AlertHistory' && (
          <AlertHistoryScreen navigation={mockNavigation} />
        )}
      </View>
    );
  };
}
