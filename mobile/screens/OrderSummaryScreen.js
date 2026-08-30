import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderSummaryScreen({ navigation, route }) {
  const { total = 252, quantity = 6, seller = 'Household A', listingId } = route.params || {};
  const rate = (total / quantity).toFixed(0);

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-6">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f6b4b" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Order Summary</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* Seller Info */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
          <View className="flex-row items-center">
            <View className="h-16 w-16 rounded-full bg-[#dce9e1] items-center justify-center mr-4 border border-[#c6d8ce] overflow-hidden">
               <MaterialCommunityIcons name="solar-panel" size={32} color="#0f6b4b" />
            </View>
            <View>
              <Text className="text-xs font-bold text-gray-600 tracking-wider mb-1">SELLER</Text>
              <Text className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'serif' }}>{seller}</Text>
              <View className="flex-row items-center mt-1">
                <MaterialCommunityIcons name="check-decagram-outline" size={14} color="#0f6b4b" />
                <Text className="text-[10px] text-[#0f6b4b] font-bold ml-1">Verified Community Member</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Energy Details */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'serif' }}>Energy Details</Text>
          
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="bg-[#e2ebe6] p-2.5 rounded-full mr-3">
                <MaterialCommunityIcons name="solar-power" size={20} color="#0f6b4b" />
              </View>
              <Text className="text-sm text-gray-600">Energy Type</Text>
            </View>
            <Text className="text-sm font-bold text-gray-900">Solar</Text>
          </View>
          
          <View className="h-[1px] bg-gray-100 mb-5" />

          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="bg-[#e2ebe6] p-2.5 rounded-full mr-3">
                <MaterialCommunityIcons name="battery-charging-60" size={20} color="#0f6b4b" />
              </View>
              <Text className="text-sm text-gray-600">Quantity</Text>
            </View>
            <Text className="text-sm font-bold text-[#0f6b4b]">{quantity} kWh</Text>
          </View>

          <View className="h-[1px] bg-gray-100 mb-5" />

          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="bg-[#e2ebe6] p-2.5 rounded-full mr-3">
                <MaterialCommunityIcons name="tag-outline" size={20} color="#0f6b4b" />
              </View>
              <Text className="text-sm text-gray-600">Rate</Text>
            </View>
            <Text className="text-sm font-bold text-gray-900">LKR {rate} / kWh</Text>
          </View>

          <View className="bg-[#e2e8e4] rounded-xl p-4 flex-row items-start border border-[#d2ddd6]">
            <MaterialCommunityIcons name="information-outline" size={20} color="#666" className="mr-3" />
            <Text className="text-[10px] text-gray-700 flex-1 leading-4">
              You are purchasing a portion of the available 8 kWh offered by this seller.
            </Text>
          </View>
        </View>

        {/* Subtotal */}
        <View className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
          <View className="flex-row justify-between items-end mb-5">
            <Text className="text-lg text-gray-600 mb-2">Subtotal</Text>
            <Text className="text-5xl font-bold text-[#0f6b4b]" style={{ fontFamily: 'serif' }}>LKR {total}</Text>
          </View>
          <View className="h-[1px] bg-gray-300 mb-4" />
          <View className="flex-row justify-between items-center">
            <Text className="text-[10px] text-gray-700 font-bold">Platform Fee (0%)</Text>
            <Text className="text-[10px] text-gray-900 font-bold">LKR 0</Text>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-[#0f6b4b] rounded-xl py-4 flex-row justify-center items-center mb-4"
          onPress={() => navigation.navigate('Payment', { total, quantity, seller, listingId })}
        >
          <Text className="text-white font-bold text-sm mr-2">Proceed to Payment</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="py-3 flex-row justify-center items-center mb-10"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-[#0f6b4b] font-bold text-sm">Cancel Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
