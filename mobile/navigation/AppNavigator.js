import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
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
import LoginScreen from '../screens/LoginScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NewMessageScreen from '../screens/NewMessageScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
      <Stack.Screen name="ReviewListing" component={ReviewListingScreen} />
      <Stack.Screen name="AdminApprovals" component={AdminApprovalsScreen} />
      <Stack.Screen name="MyListings" component={MyListingsScreen} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="SellEnergy" component={SellEnergyScreen} />
      <Stack.Screen name="SellSuccess" component={SellSuccessScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      {/* 1-to-1 Messaging Screens */}
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="NewMessage" component={NewMessageScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
