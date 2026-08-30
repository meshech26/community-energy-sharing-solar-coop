import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

export default function SellEnergyScreen({ navigation }) {
  const [quantity, setQuantity] = useState('10');
  const [price, setPrice] = useState('45');
  const [date, setDate] = useState('08/29/2026');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/energy/listings', {
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(price),
        availableDate: new Date(date).toISOString(),
        description: description
      });
      navigation.navigate('SellSuccess');
    } catch (e) {
      console.error(e);
      // Fallback for mock if backend fails
      navigation.navigate('MyListings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <Text className="text-[#0f6b4b] text-xl font-bold mr-1">.</Text>
          <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Solar Share</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <MaterialCommunityIcons name="logout" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center mb-4">
          <MaterialCommunityIcons name="arrow-left" size={14} color="#0f6b4b" />
          <Text className="text-[#0f6b4b] font-bold ml-1 text-xs">Back to Dashboard</Text>
        </TouchableOpacity>
        
        <Text className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>Sell Energy</Text>
        <Text className="text-gray-600 mb-6 text-sm">List your excess renewable energy on the community marketplace.</Text>

        <View className="bg-[#f6fbf9] rounded-2xl p-5 shadow-sm border border-[#e8f1ec] mb-8">
          
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-800 mb-2">Energy Quantity</Text>
            <View className="border border-gray-300 rounded-lg bg-white flex-row items-center justify-between px-3 py-2">
              <TextInput 
                placeholder="10" 
                className="flex-1 text-sm text-gray-900"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              <Text className="text-gray-600 font-semibold text-xs">kWh</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-gray-800 mb-2">Unit Price</Text>
            <View className="border border-gray-300 rounded-lg bg-white flex-row items-center justify-between px-3 py-2">
              <TextInput 
                placeholder="45" 
                className="flex-1 text-sm text-gray-900"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <Text className="text-gray-600 font-semibold text-xs">LKR/kWh</Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#e8f1ec] mb-6" />

          <Text className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: 'serif' }}>Availability Schedule</Text>
          
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-800 mb-2">Date</Text>
            <View className="border border-gray-300 rounded-lg bg-white flex-row items-center px-3 py-2 justify-between">
              <View className="flex-row items-center flex-1">
                <MaterialCommunityIcons name="calendar-blank-outline" size={16} color="#333" className="mr-2" />
                <TextInput 
                  value={date} 
                  className="flex-1 text-sm text-gray-900" 
                  onChangeText={setDate}
                />
              </View>
              <MaterialCommunityIcons name="calendar-month" size={16} color="#333" />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-gray-800 mb-2">Time Window</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 border border-gray-300 rounded-lg bg-white flex-row items-center px-3 py-2 justify-between">
                <TextInput 
                  value={startTime} 
                  className="flex-1 text-sm text-gray-900" 
                  onChangeText={setStartTime}
                />
                <MaterialCommunityIcons name="clock-outline" size={14} color="#333" />
              </View>
              <Text className="mx-2 text-gray-400">-</Text>
              <View className="flex-1 border border-gray-300 rounded-lg bg-white flex-row items-center px-3 py-2 justify-between">
                <TextInput 
                  value={endTime} 
                  className="flex-1 text-sm text-gray-900" 
                  onChangeText={setEndTime}
                />
                <MaterialCommunityIcons name="clock-outline" size={14} color="#333" />
              </View>
            </View>
          </View>

          <View className="mb-8">
            <View className="flex-row justify-between items-end mb-2">
              <Text className="text-xs font-bold text-gray-800">Description</Text>
              <Text className="text-[10px] text-gray-500">(Optional)</Text>
            </View>
            <View className="border border-gray-300 rounded-lg bg-white px-3 py-3">
              <TextInput 
                placeholder="e.g., Excess solar generation from clear afternoon sky." 
                className="text-sm text-gray-600"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
              <View className="items-end mt-1">
                <MaterialCommunityIcons name="resize-bottom-right" size={10} color="#ccc" />
              </View>
            </View>
          </View>

          <View className="bg-[#e2ebe6] rounded-xl p-5 mb-6 border border-[#c6d8ce]">
            <View className="flex-row items-center mb-3">
              <MaterialCommunityIcons name="cash" size={16} color="#666" />
              <Text className="text-[10px] font-bold text-gray-600 uppercase ml-2 tracking-wider">Estimated Value</Text>
            </View>
            <Text className="text-2xl font-bold text-[#0f6b4b] mb-1">
              LKR <Text className="text-4xl" style={{ fontFamily: 'serif' }}>{parseFloat(quantity || 0) * parseFloat(price || 0)}</Text>
            </Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="information-outline" size={10} color="#666" />
              <Text className="text-[10px] text-gray-600 ml-1 font-semibold">Based on {quantity} kWh @ {price} LKR</Text>
            </View>
          </View>

          <TouchableOpacity 
            className={`bg-[#0f6b4b] rounded-xl py-3.5 flex-row justify-center items-center mb-6 shadow-sm ${loading ? 'opacity-70' : ''}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-sm">Submit for Approval</Text>
            )}
          </TouchableOpacity>

          <View className="bg-[#f0f0f0] rounded-lg p-3 flex-row items-start">
            <MaterialCommunityIcons name="check-circle-outline" size={14} color="#666" className="mr-2 mt-0.5" />
            <Text className="text-[10px] text-gray-700 flex-1 leading-4">
              Listings <Text className="font-bold">must</Text> be approved <Text className="font-bold">by</Text> the Co-op Admin before appearing <Text className="font-bold">in</Text> the marketplace.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
