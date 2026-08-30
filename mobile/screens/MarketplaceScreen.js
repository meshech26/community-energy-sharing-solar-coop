import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

export default function MarketplaceScreen({ navigation }) {
  const isCoopAdmin = false; 
  
  const [searchLocation, setSearchLocation] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/energy/listings');
      setListings(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [])
  );

  // Mock data if fetch fails or is empty, to match the mockups
  const mockListings = [
    { _id: '1', sellerId: { name: 'Household A' }, trusted: true, distance: '1.2 km away', approvedQuantity: 8, approvedUnitPrice: 42, availableDate: 'Today, 2 PM - 6 PM' },
    { _id: '2', sellerId: { name: 'Green Villa' }, trusted: false, distance: '3.5 km away', approvedQuantity: 15, approvedUnitPrice: 40, availableDate: 'Tomorrow, 10 AM - 4 PM' },
    { _id: '3', sellerId: { name: 'Sunshine Co-op' }, demand: 'High Demand', distance: '0.8 km away', approvedQuantity: 4.5, approvedUnitPrice: 45, availableDate: 'Today, 1 PM - 3 PM' },
  ];

  const displayListings = listings.length > 0 ? listings : mockListings;

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100 bg-white">
        <View className="flex-row items-center">
          <Text className="text-[#0f6b4b] text-xl font-bold mr-1">.</Text>
          <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Solar Share</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Title */}
        <Text className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'serif' }}>Available Energy</Text>
        <Text className="text-gray-600 mb-6 text-xs">Browse local households selling surplus solar energy.</Text>

        {/* Filters */}
        <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <View className="mb-3">
            <Text className="text-[10px] font-bold text-gray-800 mb-1">Search Location</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
              <MaterialCommunityIcons name="magnify" size={16} color="#666" className="mr-2" />
              <TextInput 
                placeholder="e.g. Colombo 03" 
                className="flex-1 text-xs" 
                value={searchLocation}
                onChangeText={setSearchLocation}
              />
            </View>
          </View>
          
          <View className="mb-3">
            <Text className="text-[10px] font-bold text-gray-800 mb-1">Min Quantity</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2 justify-between">
              <TextInput 
                placeholder="0" 
                className="flex-1 text-xs" 
                keyboardType="numeric" 
                value={minQuantity}
                onChangeText={setMinQuantity}
              />
              <Text className="text-gray-500 text-[10px]">kWh</Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-[10px] font-bold text-gray-800 mb-1">Max Price</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2 justify-between">
              <TextInput 
                placeholder="50" 
                className="flex-1 text-xs" 
                keyboardType="numeric" 
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
              <Text className="text-gray-500 text-[10px]">LKR/kWh</Text>
            </View>
          </View>

          <TouchableOpacity className="bg-gray-200 py-2.5 rounded-lg flex-row items-center justify-center">
            <MaterialCommunityIcons name="filter-variant" size={16} color="#333" className="mr-2" />
            <Text className="text-gray-800 text-xs font-bold">Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Listings */}
        {loading ? (
          <ActivityIndicator size="large" color="#0f6b4b" className="mt-10" />
        ) : (
          displayListings.map((item, index) => {
            const quantity = item.approvedQuantity > 0 ? item.approvedQuantity : item.pendingQuantity;
            const price = item.approvedUnitPrice > 0 ? item.approvedUnitPrice : item.pendingUnitPrice;
            const sellerName = item.sellerId?.name || 'Local Household';
            const dateStr = item.availableDate || 'N/A';
            const distance = item.distance || '1.5 km away';
            
            return (
              <View key={item._id || index.toString()} className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-lg font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{sellerName}</Text>
                    <View className="flex-row items-center mt-1">
                      <MaterialCommunityIcons name="map-marker-outline" size={12} color="#666" />
                      <Text className="text-[10px] text-gray-500 ml-1">{distance}</Text>
                    </View>
                  </View>
                  {item.trusted && (
                    <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
                      <MaterialCommunityIcons name="check-circle-outline" size={10} color="#0f6b4b" className="mr-1" />
                      <Text className="text-[#0f6b4b] text-[8px] font-bold">Trusted</Text>
                    </View>
                  )}
                  {item.demand && (
                    <View className="bg-red-100 px-2 py-1 rounded-full flex-row items-center">
                      <MaterialCommunityIcons name="fire" size={10} color="#b91c1c" className="mr-1" />
                      <Text className="text-red-700 text-[8px] font-bold">{item.demand}</Text>
                    </View>
                  )}
                </View>

                <View className="bg-[#eaf4ef] rounded-xl p-4 flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-[9px] text-gray-600 mb-1" style={{ fontFamily: 'serif' }}>Available Energy</Text>
                    <Text className="text-xl font-bold text-[#0f6b4b]" style={{ fontFamily: 'serif' }}>{quantity} kWh</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[9px] text-gray-600 mb-1">Price</Text>
                    <Text className="text-lg font-bold text-gray-900" style={{ fontFamily: 'serif' }}>LKR {price}<Text className="text-[10px] text-gray-500 font-normal">/kWh</Text></Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-4">
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                  <Text className="text-[10px] text-gray-600 ml-1" style={{ fontFamily: 'serif' }}>Available: {dateStr}</Text>
                </View>

                <TouchableOpacity 
                  className="bg-[#0f6b4b] rounded-lg py-3 flex-row justify-center items-center"
                  onPress={() => navigation.navigate('ListingDetails', { listing: item })}
                >
                  <Text className="text-white text-sm font-bold mr-1" style={{ fontFamily: 'serif' }}>Buy Energy</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )
          })
        )}
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
