import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ListingDetailsScreen({ navigation, route }) {
  const { listing } = route.params || {};

  const maxQuantity = listing?.approvedQuantity > 0 ? listing?.approvedQuantity : (listing?.pendingQuantity || 8);
  const price = listing?.approvedUnitPrice > 0 ? listing?.approvedUnitPrice : (listing?.pendingUnitPrice || 42);
  const sellerName = listing?.sellerId?.name || 'Household A';
  const unit = listing?.approvedUnit || 'kWh';
  
  const [purchaseQuantity, setPurchaseQuantity] = useState(Math.min(6, maxQuantity));
  
  const handleIncrease = () => {
    if (purchaseQuantity < maxQuantity) setPurchaseQuantity(purchaseQuantity + 1);
  };
  
  const handleDecrease = () => {
    if (purchaseQuantity > 1) setPurchaseQuantity(purchaseQuantity - 1);
  };

  const progressPercentage = (purchaseQuantity / maxQuantity) * 100;

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-6">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Listing Details</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Profile Card */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
          <View className="flex-row items-center mb-4">
            <View className="h-14 w-14 rounded-full bg-blue-100 items-center justify-center mr-4 overflow-hidden">
               {/* Mock Avatar */}
               <MaterialCommunityIcons name="account" size={32} color="#0f6b4b" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{sellerName}</Text>
              <View className="flex-row items-center mt-1">
                <MaterialCommunityIcons name="map-marker-outline" size={12} color="#666" />
                <Text className="text-xs text-gray-600 ml-1">1.2 km away</Text>
              </View>
            </View>
          </View>
          
          <View className="flex-row mb-5">
            <View className="bg-gray-200 px-2 py-1 rounded flex-row items-center mr-2">
              <MaterialCommunityIcons name="star-outline" size={12} color="#666" />
              <Text className="text-xs text-gray-700 ml-1">4.9 (24 trades)</Text>
            </View>
            <View className="bg-green-300 px-2 py-1 rounded">
              <Text className="text-xs font-bold text-[#0f6b4b]">Verified Seller</Text>
            </View>
          </View>

          <Text className="text-gray-600 text-sm leading-5">
            "We have excess solar energy generated during the day while we are at work. Happy to share it with the community!"
          </Text>
        </View>

        {/* Energy Details Card */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
          <Text className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'serif' }}>Energy Details</Text>
          
          <View className="flex-row justify-between mb-6">
            <View className="flex-1 bg-[#e2e8e4] rounded-xl p-4 mr-2">
              <Text className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-2">AVAILABLE</Text>
              <Text className="text-2xl font-bold text-gray-900"><Text style={{ fontFamily: 'serif' }}>{maxQuantity}</Text> kWh</Text>
            </View>
            <View className="flex-1 bg-[#f0ede6] rounded-xl p-4 ml-2">
              <Text className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-2">RATE</Text>
              <Text className="text-2xl font-bold text-[#0f6b4b]"><Text style={{ fontFamily: 'serif' }}>LKR {price}</Text> <Text className="text-sm text-gray-600 font-normal">/kWh</Text></Text>
            </View>
          </View>

          <View className="bg-[#fcfcfc] border border-gray-200 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <MaterialCommunityIcons name="clock-outline" size={18} color="#333" />
              <Text className="text-sm font-bold text-gray-900 ml-2">Availability Schedule</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Today</Text>
              <Text className="text-sm text-gray-600">10:00 AM - 04:00 PM</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Tomorrow</Text>
              <Text className="text-sm text-gray-600">09:00 AM - 05:00 PM</Text>
            </View>
          </View>
        </View>

        {/* Purchase Amount Card */}
        <View className="bg-white rounded-2xl p-5 mb-8 border border-gray-200">
          <Text className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'serif' }}>Purchase Amount</Text>
          <Text className="text-sm font-bold text-gray-800 mb-3">Select Quantity (kWh)</Text>
          
          <View className="flex-row items-center bg-[#f4f4f4] rounded-xl border border-gray-300 p-1 mb-6">
            <TouchableOpacity 
              className="bg-white h-12 w-12 rounded-lg items-center justify-center border border-gray-200 shadow-sm"
              onPress={handleDecrease}
            >
              <MaterialCommunityIcons name="minus" size={24} color="#0f6b4b" />
            </TouchableOpacity>
            
            <View className="flex-1 items-center justify-center">
              <Text className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{purchaseQuantity}</Text>
            </View>
            
            <TouchableOpacity 
              className="bg-[#0f6b4b] h-12 w-12 rounded-lg items-center justify-center shadow-sm"
              onPress={handleIncrease}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="h-2 bg-gray-200 rounded-full w-full mb-2">
            <View 
              className="h-2 bg-[#0f6b4b] rounded-full" 
              style={{ width: `${progressPercentage}%` }} 
            />
          </View>
          <Text className="text-[10px] text-gray-500 text-right">Max: {maxQuantity} kWh</Text>
        </View>
        
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Bar */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 flex-row">
        <TouchableOpacity 
          className="flex-1 bg-white border border-[#0f6b4b] rounded-xl py-3 items-center justify-center mr-2"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-[#0f6b4b] font-bold">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 bg-[#0f6b4b] rounded-xl py-3 items-center justify-center ml-2"
          onPress={() => navigation.navigate('OrderSummary', { 
            total: purchaseQuantity * price, 
            quantity: purchaseQuantity, 
            seller: sellerName,
            listingId: listing?._id
          })}
        >
          <Text className="text-white font-bold">Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
