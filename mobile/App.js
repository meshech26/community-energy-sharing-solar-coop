import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import AppNavigator from './navigation/AppNavigator';
import './global.css';

import { StripeProvider } from './StripeWrapper';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'http://localhost:8081', 'http://127.0.0.1:8081', 'exp://'],
  config: {
    screens: {
      MainTabs: {
        path: '',
        screens: {
          Dashboard: 'dashboard',
          'Energy Sharing': 'energy-sharing',
          Community: 'community',
          'My Impact': 'my-impact',
        },
      },
      Login: 'login',
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
    },
  },
};

export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_dummy">
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </StripeProvider>
  );
}