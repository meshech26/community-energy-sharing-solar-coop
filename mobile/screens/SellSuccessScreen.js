import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SellSuccessScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9] items-center justify-center px-6">
      
      <View className="bg-white rounded-2xl p-8 w-full border border-gray-200 shadow-sm items-center">
        
        <View className="h-24 w-24 rounded-full bg-[#0f6b4b] items-center justify-center mb-6">
           <MaterialCommunityIcons name="check-circle-outline" size={56} color="#fff" />
        </View>

        <Text className="text-3xl font-bold text-gray-900 mb-3 text-center leading-10" style={{ fontFamily: 'serif' }}>Listing Submitted{'\n'}Successfully</Text>
        <Text className="text-center text-gray-700 mb-8 px-2 leading-6 text-sm">
          Your energy listing is now under review. We'll notify you once it's live on the marketplace.
        </Text>

        <View className="bg-[#e2ebe6] rounded-xl p-5 w-full mb-8 border border-[#c6d8ce]">
          <Text className="text-sm font-semibold text-gray-700 mb-4">Listing Summary</Text>
          
          <View className="flex-row justify-between items-baseline mb-4">
            <Text className="text-xl font-bold text-gray-900">10 kWh</Text>
            <Text className="text-lg font-bold text-[#0f6b4b]">@ LKR 45/kWh</Text>
          </View>
          
          <View className="h-[1px] bg-[#c6d8ce] mb-4" />

          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-semibold text-gray-700">Status</Text>
            <View className="bg-[#f5dbba] px-3 py-1.5 rounded-full flex-row items-center border border-[#eecda5]">
              <MaterialCommunityIcons name="hourglass" size={14} color="#8a4d13" />
              <Text className="text-[10px] font-bold text-[#8a4d13] ml-1 tracking-wider uppercase">Pending Approval</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-[#0f6b4b] rounded-xl py-4 w-full flex-row justify-center items-center mb-4"
          onPress={() => navigation.navigate('MyListings')}
        >
          <Text className="text-white font-bold text-sm">View My Listings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-white border border-[#0f6b4b] rounded-xl py-4 w-full flex-row justify-center items-center"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard' })}
        >
          <Text className="text-[#0f6b4b] font-bold text-sm">Back to Home</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
