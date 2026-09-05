import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { useAuthStore } from '../store/authStore';

export default function MarketplaceScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const isCoopAdmin = Boolean(user?.isCoopAdmin); 

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };
  
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
    { _id: '4', sellerId: { name: 'Eco Haven' }, trusted: true, distance: '2.1 km away', approvedQuantity: 25, approvedUnitPrice: 44, availableDate: 'Today, 11 AM - 5 PM' },
    { _id: '5', sellerId: { name: 'Solar Crest' }, demand: 'High Demand', distance: '1.8 km away', approvedQuantity: 30, approvedUnitPrice: 42, availableDate: 'Today, 12 PM - 6 PM' },
    { _id: '6', sellerId: { name: 'Highland Peak' }, trusted: false, distance: '4.0 km away', approvedQuantity: 50, approvedUnitPrice: 52, availableDate: 'Tomorrow, 9 AM - 3 PM' },
  ];

  const rawListings = listings.length > 0 ? listings : mockListings;

  const minQ = parseFloat(minQuantity);
  const maxP = parseFloat(maxPrice);

  const displayListings = rawListings.filter((item) => {
    const qty = Number(item.approvedQuantity > 0 ? item.approvedQuantity : item.pendingQuantity || item.quantity || 0);
    const price = Number(item.approvedUnitPrice > 0 ? item.approvedUnitPrice : item.pendingUnitPrice || item.unitPrice || 0);

    if (!isNaN(minQ) && qty < minQ) {
      return false;
    }
    if (!isNaN(maxP) && price > maxP) {
      return false;
    }
    return true;
  });

  const hasActiveFilters = Boolean(minQuantity || maxPrice);

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100 bg-white">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="solar-panel-large" size={20} color="#0f6b4b" />
          <Text className="text-xl font-bold ml-2 text-gray-900" style={{ fontFamily: 'serif' }}>Solar Share</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#0f6b4b" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Admin Approvals Banner - Only visible to Admin (isCoopAdmin: true) */}
        {isCoopAdmin && (
          <TouchableOpacity 
            className="bg-[#e2e8e4] p-4 rounded-xl flex-row items-center justify-between mb-5 border border-emerald-200"
            onPress={() => navigation.navigate('AdminApprovals')}
          >
            <View className="flex-row items-center flex-1">
              <MaterialCommunityIcons name="shield-check-outline" size={24} color="#0f6b4b" className="mr-3" />
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-800 text-sm">Admin Approvals</Text>
                  <View className="bg-[#0f6b4b] px-1.5 py-0.5 rounded ml-2">
                    <Text className="text-white text-[9px] font-bold">Only Admin</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-xs">Review and authorize pending cooperative energy listings.</Text>
              </View>
            </View>
            <Text className="text-[#0f6b4b] font-bold text-sm ml-2">Review</Text>
          </TouchableOpacity>
        )}

        {/* Title */}
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Available Energy</Text>
          <Text className="text-xs font-semibold text-gray-500">
            {displayListings.length} {displayListings.length === 1 ? 'listing' : 'listings'}
          </Text>
        </View>
        <Text className="text-gray-600 mb-5 text-xs">Browse local households selling surplus solar energy.</Text>

        {/* Filters */}
        <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <View className="mb-3">
            <Text className="text-[10px] font-bold text-gray-800 mb-1">Min Quantity</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2 justify-between">
              <TextInput 
                placeholder="0" 
                className="flex-1 text-xs text-gray-900" 
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
                className="flex-1 text-xs text-gray-900" 
                keyboardType="numeric" 
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
              <Text className="text-gray-500 text-[10px]">LKR/kWh</Text>
            </View>
          </View>

          <View className="flex-row space-x-2">
            <View className="flex-1 bg-gray-100 py-2.5 rounded-lg flex-row items-center justify-center mr-1">
              <MaterialCommunityIcons name="filter-variant" size={16} color="#333" className="mr-2" />
              <Text className="text-gray-800 text-xs font-bold">
                {hasActiveFilters ? `Filtering (${displayListings.length} results)` : 'Filters'}
              </Text>
            </View>
            {hasActiveFilters && (
              <TouchableOpacity 
                onPress={() => { setMinQuantity(''); setMaxPrice(''); }}
                className="bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg flex-row items-center justify-center ml-1"
              >
                <MaterialCommunityIcons name="close-circle-outline" size={14} color="#dc2626" className="mr-1" />
                <Text className="text-red-700 text-xs font-semibold">Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Listings */}
        {loading ? (
          <ActivityIndicator size="large" color="#0f6b4b" className="mt-10" />
        ) : displayListings.length === 0 ? (
          <View className="items-center justify-center py-10 px-4 bg-white rounded-2xl border border-gray-200 my-2">
            <MaterialCommunityIcons name="filter-remove-outline" size={40} color="#9ca3af" className="mb-2" />
            <Text className="text-base font-bold text-gray-800 mb-1" style={{ fontFamily: 'serif' }}>No Matching Listings</Text>
            <Text className="text-xs text-gray-500 text-center mb-4">
              No energy offers match Min: {minQuantity || '0'} kWh and Max: LKR {maxPrice || '∞'}/kWh.
            </Text>
            <TouchableOpacity 
              onPress={() => { setMinQuantity(''); setMaxPrice(''); }}
              className="bg-[#0f6b4b] px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-xs font-bold">Clear Filters</Text>
            </TouchableOpacity>
          </View>
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
