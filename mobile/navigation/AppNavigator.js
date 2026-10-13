import React, { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Platform, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ExpoLinking from 'expo-linking';

import AppHeader from '../components/AppHeader';
import CurrentUserRefresh from '../components/CurrentUserRefresh';
import NotificationProvider from '../components/community/NotificationProvider';
import CommunityNavigator from './CommunityNavigator';
import navigationFocusLayout from './NavigationFocusLayout';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { ForgotPasswordScreen, ResetPasswordScreen } from '../screens/account/AccountScreens';

import DashboardScreen from '../screens/DashboardScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import MyImpactScreen from '../screens/MyImpactScreen';

import ListingDetailsScreen from '../screens/ListingDetailsScreen';
import ReviewListingScreen from '../screens/ReviewListingScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import SellEnergyScreen from '../screens/SellEnergyScreen';
import SellSuccessScreen from '../screens/SellSuccessScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import AdminApprovalsScreen from '../screens/AdminApprovalsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NewMessageScreen from '../screens/NewMessageScreen';
import ChatScreen from '../screens/ChatScreen';

import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const notificationNavigation = {
  navigate: (screen, params) => {
    if (navigationRef.isReady()) navigationRef.navigate('Community', { screen, params });
  },
};

const tabIcons = {
  Dashboard: 'view-dashboard-outline',
  'Energy Sharing': 'solar-power-variant-outline',
  Community: 'account-group-outline',
  'My Impact': 'chart-line-variant',
};

function AuthNavigator({ resetToken }) {
  return (
    <Stack.Navigator
      layout={navigationFocusLayout}
      initialRouteName={resetToken ? 'ResetPassword' : 'Login'}
      screenOptions={{ animation: 'fade', headerShown: false }}
    >
      <Stack.Screen component={LoginScreen} name="Login" />
      <Stack.Screen component={RegisterScreen} name="Register" />
      <Stack.Screen component={ForgotPasswordScreen} name="ForgotPassword" />
      <Stack.Screen
        component={ResetPasswordScreen}
        name="ResetPassword"
        initialParams={{ token: resetToken }}
      />
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
        header: () => (
          <AppHeader
            onAccount={() => navigationRef.navigate('Community', { screen: 'MyAccount' })}
          />
        ),
        tabBarActiveTintColor: '#16764C',
        tabBarActiveBackgroundColor: '#EAF5EC',
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: '#627168',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons color={color} name={tabIcons[route.name]} size={size} />
        ),
        tabBarIconStyle: { marginTop: 1 },
        tabBarItemStyle: { borderRadius: 10, marginHorizontal: 2, minHeight: 54 },
        tabBarLabelPosition: 'below-icon',
        tabBarAllowFontScaling: true,
        tabBarLabel: ({ color, focused, children }) => (
          <Text
            style={{
              color,
              fontSize: 11,
              lineHeight: 14,
              fontWeight: focused ? '600' : '500',
              textAlign: 'center',
              maxWidth: '100%',
              paddingHorizontal: 2,
              marginBottom: 3,
            }}
          >
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E3EAE5',
          height: 80 + Math.max(0, fontScale - 1) * 56 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 7,
        },
      })}
    >
      <Tab.Screen
        component={DashboardScreen}
        name="Dashboard"
        options={{ tabBarAccessibilityLabel: 'Open Dashboard' }}
      />
      <Tab.Screen
        component={MarketplaceScreen}
        name="Energy Sharing"
        options={{ tabBarAccessibilityLabel: 'Open Energy Sharing' }}
      />
      <Tab.Screen
        component={CommunityNavigator}
        name="Community"
        options={{ tabBarAccessibilityLabel: 'Open Community' }}
      />
      <Tab.Screen
        component={MyImpactScreen}
        name="My Impact"
        options={{ tabBarAccessibilityLabel: 'Open My Impact' }}
      />
    </Tab.Navigator>
  );
}

function AuthenticatedNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="MainTabs" component={MainTabs} />
      <AuthStack.Screen name="ListingDetails" component={ListingDetailsScreen} />
      <AuthStack.Screen name="ReviewListing" component={ReviewListingScreen} />
      <AuthStack.Screen name="AdminApprovals" component={AdminApprovalsScreen} />
      <AuthStack.Screen name="MyListings" component={MyListingsScreen} />
      <AuthStack.Screen name="OrderSummary" component={OrderSummaryScreen} />
      <AuthStack.Screen name="Payment" component={PaymentScreen} />
      <AuthStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <AuthStack.Screen name="SellEnergy" component={SellEnergyScreen} />
      <AuthStack.Screen name="SellSuccess" component={SellSuccessScreen} />
      <AuthStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <AuthStack.Screen name="Messages" component={MessagesScreen} />
      <AuthStack.Screen name="NewMessage" component={NewMessageScreen} />
      <AuthStack.Screen name="Chat" component={ChatScreen} />
    </AuthStack.Navigator>
  );
}

const prefix = ExpoLinking.createURL('/');

const linking = {
  prefixes: [prefix, 'http://localhost:8081', 'http://127.0.0.1:8081', 'exp://'],
  config: {
    screens: {
      Login: '',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password/:token',
      MainTabs: {
        path: 'app',
        screens: {
          Dashboard: 'dashboard',
          'Energy Sharing': 'energy-sharing',
          Community: 'community',
          'My Impact': 'my-impact',
        },
      },
      ListingDetails: 'listing-details',
      ReviewListing: 'review-listing',
      AdminApprovals: 'admin-approvals',
      MyListings: 'my-listings',
      OrderSummary: 'order-summary',
      Payment: 'payment',
      PaymentSuccess: 'payment-complete',
      SellEnergy: 'sell-energy',
      SellSuccess: 'sell-success',
      TransactionHistory: 'transaction-history',
      Messages: 'messages',
      NewMessage: 'new-message',
      Chat: 'chat',
    },
  },
};

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [resetToken, setResetToken] = useState(null);
  const [navigationReady, setNavigationReady] = useState(false);

  // On web, '/' can supply a Login state before the email hash is read.
  // Explicitly open the reset route once ready instead of relying on initialRouteName.
  useEffect(() => {
    if (navigationReady && resetToken && !isAuthenticated && navigationRef.isReady()) {
      navigationRef.navigate('ResetPassword', { token: resetToken });
    }
  }, [navigationReady, resetToken, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) setResetToken(null);
  }, [isAuthenticated]);

  useEffect(() => {
    const receive = (url) => {
      const match = url?.match(/#reset-password\/([^?#]*)/);
      if (match) setResetToken(match[1] || 'invalid');
    };
    Linking.getInitialURL().then(receive).catch(() => {});
    const listener = Linking.addEventListener('url', ({ url }) => receive(url));
    const receiveHash = () => receive(window.location.href);
    if (Platform.OS === 'web') window.addEventListener('hashchange', receiveHash);
    return () => {
      listener.remove();
      if (Platform.OS === 'web') window.removeEventListener('hashchange', receiveHash);
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef} linking={linking} onReady={() => setNavigationReady(true)}>
      {isAuthenticated ? (
        <NotificationProvider navigation={notificationNavigation}>
          <CurrentUserRefresh />
          <AuthenticatedNavigator />
        </NotificationProvider>
      ) : (
        <AuthNavigator resetToken={resetToken} />
      )}
    </NavigationContainer>
  );
}
