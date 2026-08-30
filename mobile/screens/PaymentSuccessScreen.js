import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

export default function PaymentSuccessScreen({ navigation, route }) {
  const { total = 252, quantity = 6, seller = 'Green Acres Farm', listingId } = route.params || {};
  const rate = (total / quantity).toFixed(0);

  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createOrder = async () => {
      try {
        if (!listingId) {
          setOrderId(`#12345`);
          setLoading(false);
          return;
        }

        const res = await axios.post('http://127.0.0.1:5000/api/energy/orders', {
          listingId: listingId,
          quantity: parseFloat(quantity)
        });
        
        setOrderId('#' + res.data.data._id.toString().slice(-5).toUpperCase());
      } catch (e) {
        console.error(e);
        setOrderId(`#ERR${Math.floor(Math.random() * 900)}`);
      } finally {
        setLoading(false);
      }
    };
    
    createOrder();
  }, [listingId, quantity]);

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9] items-center justify-center px-6">
      
      <View className="h-24 w-24 rounded-full bg-[#0f6b4b] items-center justify-center mb-6">
         <MaterialCommunityIcons name="check-circle-outline" size={56} color="#fff" />
      </View>

      <Text className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'serif' }}>Payment Successful!</Text>
      <Text className="text-center text-gray-700 mb-8 px-4 text-base">
        Your energy purchase has been confirmed.
      </Text>

      <View className="bg-[#e2ebe6] rounded-2xl p-6 w-full mb-8 border border-[#c6d8ce]">
        <View className="flex-row justify-between mb-4">
          <Text className="text-sm font-semibold text-gray-700">Order ID</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0f6b4b" />
          ) : (
            <Text className="text-base font-bold text-gray-900">{orderId}</Text>
          )}
        </View>
        
        <View className="h-[1px] bg-[#c6d8ce] mb-4" />

        <View className="flex-row justify-between mb-3">
          <Text className="text-sm text-gray-700">Energy Amount</Text>
          <Text className="text-sm text-gray-900">{quantity} kWh</Text>
        </View>

        <View className="flex-row justify-between mb-4">
          <Text className="text-sm text-gray-700">Rate</Text>
          <Text className="text-sm text-gray-900">LKR {rate}/kWh</Text>
        </View>
        
        <View className="h-[1px] bg-[#c6d8ce] mb-4" />

        <View className="flex-row justify-between mb-6">
          <Text className="text-sm text-gray-700">Seller</Text>
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="solar-panel" size={14} color="#0f6b4b" className="mr-1" />
            <Text className="text-sm text-gray-900">{seller}</Text>
          </View>
        </View>

        <View className="h-[1px] bg-[#c6d8ce] mb-4" />

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-xs font-bold text-gray-600 tracking-wider">TOTAL PAID</Text>
          <Text className="text-2xl font-bold text-[#0f6b4b]" style={{ fontFamily: 'serif' }}>LKR {total}</Text>
        </View>
      </View>

      <TouchableOpacity 
        className="bg-[#0f6b4b] rounded-xl py-4 w-full flex-row justify-center items-center mb-4"
        onPress={() => navigation.navigate('TransactionHistory')}
      >
        <MaterialCommunityIcons name="receipt-outline" size={20} color="#fff" />
        <Text className="text-white font-bold text-base ml-2">View Order</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        className="bg-white border-2 border-[#0f6b4b] rounded-xl py-4 w-full flex-row justify-center items-center"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Energy Sharing' })}
      >
        <MaterialCommunityIcons name="storefront-outline" size={20} color="#0f6b4b" />
        <Text className="text-[#0f6b4b] font-bold text-base ml-2">Back to Energy Marketplace</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}
