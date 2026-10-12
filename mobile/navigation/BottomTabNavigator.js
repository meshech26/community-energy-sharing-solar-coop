import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import CommunityScreen from '../screens/CommunityScreen';
import MyImpactScreen from '../screens/MyImpactScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Energy Sharing') {
            iconName = focused ? 'solar-power' : 'solar-panel-large';
          } else if (route.name === 'Community') {
            iconName = focused ? 'account-group' : 'account-group-outline';
          } else if (route.name === 'My Impact') {
            iconName = focused ? 'chart-line' : 'chart-line-variant';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0f6b4b',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: { paddingBottom: 5, paddingTop: 5, height: 60 }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Energy Sharing" component={MarketplaceScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="My Impact" component={MyImpactScreen} />
    </Tab.Navigator>
  );
}
