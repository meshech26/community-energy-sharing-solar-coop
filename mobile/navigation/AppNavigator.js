import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForgotPasswordScreen, ResetPasswordScreen } from '../screens/account/AccountScreens';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppHeader from '../components/AppHeader';
import CurrentUserRefresh from '../components/CurrentUserRefresh';
import NotificationProvider from '../components/community/NotificationProvider';
import CommunityNavigator from './CommunityNavigator';
import navigationFocusLayout from './NavigationFocusLayout';
import LoginScreen from '../screens/LoginScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();
const notificationNavigation = { navigate: (screen, params) => {
  if (navigationRef.isReady()) navigationRef.navigate('Community', { screen, params });
} };

const tabIcons = {
  Dashboard: 'view-dashboard-outline',
  'Energy Sharing': 'solar-power-variant-outline',
  Community: 'account-group-outline',
  'My Impact': 'chart-line-variant',
};

function AuthNavigator({ resetToken }) {
  return (
    <Stack.Navigator layout={navigationFocusLayout} initialRouteName={resetToken ? 'ResetPassword' : 'Login'} screenOptions={{ animation: 'fade', headerShown: false }}>
      <Stack.Screen component={LoginScreen} name="Login" />
      <Stack.Screen component={RegisterScreen} name="Register" />
      <Stack.Screen component={ForgotPasswordScreen} name="ForgotPassword" />
      <Stack.Screen component={ResetPasswordScreen} name="ResetPassword" initialParams={{ token: resetToken }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      layout={navigationFocusLayout}
      screenOptions={({ route }) => ({
        header: () => <AppHeader onAccount={() => navigationRef.navigate('Community', { screen: 'MyAccount' })} />,
        tabBarActiveTintColor: '#16764C',
        tabBarActiveBackgroundColor: '#EAF5EC',
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: '#627168',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons color={color} name={tabIcons[route.name]} size={size} />,
        tabBarIconStyle: { marginTop: 1 },
        tabBarItemStyle: { borderRadius: 10, marginHorizontal: 2, minHeight: 54 },
        tabBarLabelPosition: 'below-icon',
        tabBarAllowFontScaling: true,
        tabBarLabel: ({ color, focused, children }) => <Text style={{ color, fontSize: 11, lineHeight: 14, fontWeight: focused ? '600' : '500', textAlign: 'center', maxWidth: '100%', paddingHorizontal: 2, marginBottom: 3 }}>{children}</Text>,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E3EAE5',
          height: 80 + Math.max(0, fontScale - 1) * 56 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
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
  const [resetToken, setResetToken] = useState(null);
  useEffect(() => { if (isAuthenticated) setResetToken(null); }, [isAuthenticated]);
  useEffect(() => {
    const receive = (url) => { const match = url?.match(/#reset-password\/([^?#]*)/); if (match) setResetToken(match[1] || 'invalid'); };
    Linking.getInitialURL().then(receive).catch(() => {});
    const listener = Linking.addEventListener('url', ({ url }) => receive(url));
    return () => listener.remove();
  }, []);

  return <NavigationContainer ref={navigationRef}>{isAuthenticated ? <NotificationProvider navigation={notificationNavigation}><CurrentUserRefresh /><MainTabs /></NotificationProvider> : <AuthNavigator key={resetToken || 'login'} resetToken={resetToken} />}</NavigationContainer>;
}
