import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReviewListingScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Review Listing</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* User Card */}
        <View className="bg-white rounded-xl p-5 mb-4 border border-gray-200">
          <View className="flex-row items-center mb-4">
            <View className="h-12 w-12 rounded-full bg-blue-100 items-center justify-center mr-4 overflow-hidden">
               <MaterialCommunityIcons name="account" size={32} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Kamal Perera</Text>
              <View className="flex-row items-center mt-1">
                <MaterialCommunityIcons name="map-marker-outline" size={12} color="#666" />
                <Text className="text-[10px] text-gray-500 ml-1">Colombo 03  •  Listing ID: #EN-8472</Text>
              </View>
            </View>
          </View>
          
          <View className="bg-[#fdf4e8] self-start px-3 py-1.5 rounded-full flex-row items-center border border-[#f5dbba]">
            <MaterialCommunityIcons name="playlist-edit" size={14} color="#8a4d13" />
            <Text className="text-[10px] text-[#8a4d13] font-bold ml-1 tracking-wider">EDITED - PENDING REVIEW</Text>
          </View>
        </View>

        {/* Current Terms */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200 shadow-sm">
          <View className="flex-row items-center mb-5">
            <MaterialCommunityIcons name="history" size={20} color="#4b5563" />
            <Text className="text-xl font-bold text-gray-700 ml-2" style={{ fontFamily: 'serif' }}>Current Terms</Text>
          </View>

          <View className="bg-[#f9f9f9] rounded-xl p-4 mb-3 flex-row justify-between items-center border border-gray-200">
            <Text className="text-xs font-bold text-gray-800">Volume</Text>
            <Text className="text-lg font-bold text-gray-900"><Text style={{ fontFamily: 'serif' }}>10</Text> <Text className="text-xs text-gray-500 font-normal">kWh</Text></Text>
          </View>

          <View className="bg-[#f9f9f9] rounded-xl p-4 mb-5 flex-row justify-between items-center border border-gray-200">
            <Text className="text-xs font-bold text-gray-800">Rate</Text>
            <Text className="text-lg font-bold text-gray-900"><Text style={{ fontFamily: 'serif' }}>45</Text> <Text className="text-xs text-gray-500 font-normal">LKR/kWh</Text></Text>
          </View>

          <View className="flex-row justify-between items-center pt-2">
            <Text className="text-xs font-bold text-gray-700">Total Value</Text>
            <Text className="text-2xl font-bold text-gray-900"><Text style={{ fontFamily: 'serif' }}>450</Text> <Text className="text-sm text-gray-700 font-normal">LKR</Text></Text>
          </View>
        </View>

        {/* Proposed Terms */}
        <View className="bg-white rounded-2xl p-5 mb-4 border-2 border-[#0f6b4b] shadow-sm">
          <View className="flex-row items-center mb-5">
            <MaterialCommunityIcons name="history" size={20} color="#0f6b4b" />
            <Text className="text-xl font-bold text-[#0f6b4b] ml-2" style={{ fontFamily: 'serif' }}>Proposed Terms</Text>
          </View>

          <View className="bg-[#eef5f1] rounded-xl p-4 mb-3 flex-row justify-between items-center border border-[#d6e8de]">
            <Text className="text-xs font-bold text-[#0f6b4b]">Volume</Text>
            <View className="flex-row items-center">
              <Text className="text-lg font-bold text-[#0f6b4b] mr-1"><Text style={{ fontFamily: 'serif' }}>15</Text> <Text className="text-xs text-[#0f6b4b] font-normal">kWh</Text></Text>
              <MaterialCommunityIcons name="arrow-up" size={14} color="#0f6b4b" />
            </View>
          </View>

          <View className="bg-[#eef5f1] rounded-xl p-4 mb-5 flex-row justify-between items-center border border-[#d6e8de]">
            <Text className="text-xs font-bold text-[#0f6b4b]">Rate</Text>
            <View className="flex-row items-center">
              <Text className="text-lg font-bold text-[#0f6b4b] mr-1"><Text style={{ fontFamily: 'serif' }}>50</Text> <Text className="text-xs text-[#0f6b4b] font-normal">LKR/kWh</Text></Text>
              <MaterialCommunityIcons name="arrow-up" size={14} color="#0f6b4b" />
            </View>
          </View>

          <View className="flex-row justify-between items-center pt-2">
            <Text className="text-xs font-bold text-[#0f6b4b]">Total Value</Text>
            <Text className="text-2xl font-bold text-[#0f6b4b]"><Text style={{ fontFamily: 'serif' }}>750</Text> <Text className="text-sm text-[#0f6b4b] font-normal">LKR</Text></Text>
          </View>
        </View>

        {/* User Justification */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200 shadow-sm">
          <View className="flex-row items-start mb-2">
            <MaterialCommunityIcons name="format-quote-open" size={24} color="#333" className="mr-3 mt-1" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-800 mb-2">User Justification</Text>
              <Text className="text-sm text-gray-700 leading-6">
                "Generated excess solar power this week due to sunny weather, increasing available volume. Adjusted price slightly to reflect current peak hour demand in the neighborhood grid."
              </Text>
            </View>
          </View>
        </View>

        {/* Review Decision */}
        <View className="bg-white rounded-2xl p-5 mb-8 border border-gray-200 shadow-sm">
          <Text className="text-xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'serif' }}>Review Decision</Text>
          
          <TouchableOpacity className="bg-primary rounded-lg py-3 flex-row justify-center items-center mb-3">
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
            <Text className="text-white font-bold ml-2">Approve Changes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-white border border-red-600 rounded-lg py-3 flex-row justify-center items-center mb-4">
            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#dc2626" />
            <Text className="text-red-600 font-bold ml-2">Decline</Text>
          </TouchableOpacity>
          
          <Text className="text-[10px] text-gray-500 text-center leading-4 px-2">
            Approving will immediately update the marketplace listing and notify the user.
          </Text>
        </View>
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
