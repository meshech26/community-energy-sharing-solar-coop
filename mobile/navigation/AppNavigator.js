import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppHeader from '../components/AppHeader';
import CommunityNavigator from './CommunityNavigator';
import LoginScreen from '../screens/LoginScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons = {
  Dashboard: 'view-dashboard-outline',
  'Energy Sharing': 'solar-power-variant-outline',
  Community: 'account-group-outline',
  'My Impact': 'chart-line-variant',
};

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ animation: 'fade', headerShown: false }}>
      <Stack.Screen component={LoginScreen} name="Login" />
      <Stack.Screen component={RegisterScreen} name="Register" />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <AppHeader />,
        tabBarActiveTintColor: '#16764C',
        tabBarActiveBackgroundColor: '#EAF5EC',
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: '#748179',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons color={color} name={tabIcons[route.name]} size={size} />,
        tabBarIconStyle: { marginTop: 1 },
        tabBarItemStyle: { borderRadius: 10, marginHorizontal: 2, minHeight: 54 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E3EAE5',
          height: 72,
          paddingBottom: 8,
          paddingTop: 7,
        },
      })}
    >
      <Tab.Screen name="Dashboard" options={{ tabBarAccessibilityLabel: 'Open Dashboard' }}>{() => <PlaceholderScreen area="Dashboard" />}</Tab.Screen>
      <Tab.Screen name="Energy Sharing" options={{ tabBarAccessibilityLabel: 'Open Energy Sharing' }}>{() => <PlaceholderScreen area="Energy Sharing" />}</Tab.Screen>
      <Tab.Screen component={CommunityNavigator} name="Community" options={{ tabBarAccessibilityLabel: 'Open Community' }} />
      <Tab.Screen name="My Impact" options={{ tabBarAccessibilityLabel: 'Open My Impact' }}>{() => <PlaceholderScreen area="My Impact" />}</Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return <NavigationContainer>{isAuthenticated ? <MainTabs /> : <AuthNavigator />}</NavigationContainer>;
}
