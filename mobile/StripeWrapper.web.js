import React from 'react';
import { View, Text } from 'react-native';

export const StripeProvider = ({ children }) => <>{children}</>;

export const CardField = () => (
  <View style={{ height: 50, justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 }}>
    <Text style={{ color: '#aab7c4' }}>Card input not supported on web demo</Text>
  </View>
);

export const useStripe = () => ({
  confirmPayment: async () => {
    return { error: { message: 'Stripe payments are not supported on the web in this demo. Please use the iOS/Android app.' } };
  }
});
