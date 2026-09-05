import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Linking from 'expo-linking';
import { useStripe, CardField } from '../StripeWrapper';

export default function PaymentScreen({ navigation, route }) {
  const { total, quantity, seller = 'Household A', listingId } = route.params || { total: 252, quantity: 6 };
  const [loading, setLoading] = useState(false);
  const { confirmPayment } = useStripe();

  const handlePayment = async () => {
    setLoading(true);

    try {
      const redirectUrl = Linking.createURL('payment-complete');
      const successUrl = `${redirectUrl}?status=success&total=${total}&quantity=${quantity}&seller=${encodeURIComponent(seller)}&listingId=${listingId || ''}`;

      // 1. Create Checkout Session (cancel_url is omitted so Stripe does not show the back navigation button)
      const response = await axios.post('http://127.0.0.1:5000/api/payments/create-checkout-session', {
        amount: total, 
        currency: 'lkr',
        success_url: successUrl,
      });
      
      const { url } = response.data;
      if (!url) {
        throw new Error('Failed to get checkout URL from backend.');
      }

      // 2. Redirect to Stripe Payment Gateway
      if (Platform.OS === 'web') {
        window.location.replace(url);
      } else {
        await Linking.openURL(url);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Payment Error', 'Failed to connect to the payment gateway. Please ensure the backend server is running on port 5000.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-6 flex-row items-center">
          <MaterialCommunityIcons name="arrow-left" size={16} color="#0f6b4b" />
          <Text className="text-[#0f6b4b] font-bold ml-1 text-sm">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 mx-auto mr-12">Solar Share</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* Order Summary Card */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
          <View className="flex-row items-center mb-6">
            <MaterialCommunityIcons name="solar-panel-large" size={24} color="#0f6b4b" />
            <Text className="text-2xl font-bold text-gray-900 ml-2" style={{ fontFamily: 'serif' }}>Order Summary</Text>
          </View>

          <View className="bg-[#e2ebe6] rounded-xl p-5 border border-[#c6d8ce]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-600 text-sm">Energy Amount</Text>
              <Text className="text-gray-900 text-sm font-bold">{quantity} kWh</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 text-sm">Total Amount</Text>
              <Text className="text-[#0f6b4b] text-2xl font-bold" style={{ fontFamily: 'serif' }}>LKR {total}</Text>
            </View>
          </View>
        </View>

        {/* Secure Payment Card */}
        <View className="bg-white rounded-2xl p-5 mb-8 border border-gray-200">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="lock-outline" size={20} color="#0f6b4b" />
              <Text className="text-2xl font-bold text-gray-900 ml-2" style={{ fontFamily: 'serif' }}>Secure Payment</Text>
            </View>
            <Text className="text-2xl italic font-bold text-gray-300 ml-1">stripe</Text>
          </View>

          <View className="mb-6 items-center">
            <MaterialCommunityIcons name="shield-check" size={64} color="#0f6b4b" className="mb-4" />
            <Text className="text-xl font-bold text-gray-900 mb-2">Checkout with Stripe</Text>
            <Text className="text-center text-gray-600 mb-2 px-4 leading-5">
              You will be securely redirected to Stripe's payment gateway to complete your transaction.
            </Text>
          </View>

          <TouchableOpacity 
            className={`bg-[#0f6b4b] rounded-xl py-4 w-full flex-row justify-center items-center ${loading ? 'opacity-70' : ''}`}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="open-in-new" size={18} color="#fff" />
                <Text className="text-white font-bold text-sm ml-2">Proceed to Stripe</Text>
              </>
            )}
          </TouchableOpacity>
          
          <View className="flex-row justify-center items-center mt-6 gap-6">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="shield-outline" size={12} color="#666" />
              <Text className="text-[10px] text-gray-500 ml-1">SSL Secured</Text>
            </View>
            <View className="flex-row items-center ml-4">
              <MaterialCommunityIcons name="check-decagram-outline" size={12} color="#666" />
              <Text className="text-[10px] text-gray-500 ml-1">Stripe Verified</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
