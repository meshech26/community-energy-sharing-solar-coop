import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

export default function MyListingsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Active & Pending');
  const [dbListings, setDbListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultListings = [
    {
      id: 'default-1',
      title: 'Solar Excess - Weekend',
      description: 'Generated from rooftop panels.',
      status: 'ACTIVE',
      qty: '50 kWh',
      price: '35 LKR/kWh',
      progress: 0.6,
      left: '20 kWh left'
    },
    {
      id: 'default-2',
      title: 'Wind Energy Share',
      description: 'Community turbine allocation.',
      status: 'PENDING APPROVAL',
      qty: '120 kWh',
      price: '30 LKR/kWh',
      progress: 0,
      left: 'Awaiting review'
    },
    {
      id: 'default-3',
      title: 'Evening Peak Battery',
      description: 'Stored energy from daily solar.',
      status: 'ACTIVE',
      qty: '15 kWh',
      price: '45 LKR/kWh',
      progress: 0.9,
      left: '1.5 kWh left'
    },
    {
      id: 'default-4',
      title: 'Morning Solar Burst',
      description: 'Clear sky generation.',
      status: 'SOLD OUT',
      qty: '30 kWh',
      price: '32 LKR/kWh',
      progress: 1,
      left: ''
    }
  ];

  const fetchMyListings = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/energy/listings/my');
      if (res.data?.data) {
        const mapped = res.data.data.map((item, idx) => ({
          id: item._id || `db-${idx}`,
          title: item.description ? (item.description.length > 25 ? item.description.slice(0, 25) + '...' : item.description) : `Solar Share - ${item.pendingQuantity || item.approvedQuantity} kWh`,
          description: item.description || 'Excess residential solar energy allocation.',
          status: item.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : (item.status || 'ACTIVE'),
          qty: `${item.pendingQuantity || item.approvedQuantity} ${item.pendingUnit || 'kWh'}`,
          price: `${item.pendingUnitPrice || item.approvedUnitPrice} LKR/kWh`,
          progress: item.status === 'ACTIVE' ? 0.7 : 0,
          left: item.status === 'PENDING_APPROVAL' ? 'Awaiting review' : `${item.approvedQuantity || item.pendingQuantity} kWh left`
        }));
        setDbListings(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyListings();
    }, [])
  );

  // Combine database listings with default mock listings
  const combinedListings = [...dbListings, ...defaultListings];
  
  // Filter for tabs
  const activeAndPendingListings = combinedListings.filter(l => l.status !== 'SOLD OUT');
  const historyListings = combinedListings.filter(l => l.status === 'SOLD OUT' || l.status === 'COMPLETED');
  
  const displayedListings = activeTab === 'Active & Pending' ? activeAndPendingListings : historyListings;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100 bg-white">
        <View className="flex-row items-center">
          <Text className="text-[#0f6b4b] text-xl font-bold mr-1">.</Text>
          <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Solar Share</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <MaterialCommunityIcons name="logout" size={24} color="#0f6b4b" />
        </TouchableOpacity>
      </View>

      <View className="bg-[#f9f9f9] pt-6 px-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>My Listings</Text>
        <Text className="text-gray-600 mb-5 text-sm">Manage your energy offers and track performance.</Text>

        <TouchableOpacity 
          className="bg-[#0f6b4b] rounded-3xl py-3.5 flex-row justify-center items-center mb-6"
          onPress={() => navigation.navigate('SellEnergy')}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text className="text-white font-bold ml-1" style={{ fontFamily: 'serif' }}>Create New Listing</Text>
        </TouchableOpacity>

        {/* Custom Tabs */}
        <View className="flex-row border-b border-gray-200 mb-4">
          <TouchableOpacity 
            className={`pb-3 px-2 mr-6 flex-row items-center ${activeTab === 'Active & Pending' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('Active & Pending')}
          >
            <Text className={`font-bold mr-2 text-sm ${activeTab === 'Active & Pending' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>Active & Pending</Text>
            <View className="bg-gray-200 rounded-full h-5 w-5 items-center justify-center">
              <Text className="text-[10px] text-gray-600 font-bold">{activeAndPendingListings.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`pb-3 px-2 ${activeTab === 'History' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('History')}
          >
            <Text className={`font-bold text-sm ${activeTab === 'History' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 bg-[#f9f9f9]">
        {displayedListings.map(item => {
          const isSoldOut = item.status === 'SOLD OUT';
          const isPending = item.status === 'PENDING APPROVAL';
          
          let statusBg = 'bg-green-100';
          let statusText = 'text-primary';
          let icon = 'check-decagram';
          
          if (isPending) {
            statusBg = 'bg-orange-100';
            statusText = 'text-orange-800';
            icon = 'clock-outline';
          } else if (isSoldOut) {
            statusBg = 'bg-gray-200';
            statusText = 'text-gray-600';
            icon = 'close-box-outline';
          }

          return (
            <View key={item.id} className="bg-white rounded-xl p-5 mb-4 border border-gray-200 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View className={`${statusBg} px-2 py-1 rounded-full flex-row items-center`}>
                  <MaterialCommunityIcons name={icon} size={12} color={isPending ? '#9a3412' : (isSoldOut ? '#4b5563' : '#0f6b4b')} />
                  <Text className={`text-[10px] ${statusText} font-bold ml-1 tracking-wider`}>{item.status}</Text>
                </View>
                <TouchableOpacity>
                  <MaterialCommunityIcons name="dots-vertical" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <Text className={`text-xl font-bold mb-1 ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`} style={{ fontFamily: 'serif' }}>{item.title}</Text>
              <Text className="text-sm text-gray-500 mb-4">{item.description}</Text>

              <View className="bg-[#f4f4f4] rounded-xl p-4 mb-4 flex-row border border-gray-100">
                <View className="flex-1">
                  <Text className="text-[10px] text-gray-600 font-bold tracking-wider mb-1">LISTED QTY</Text>
                  <Text className={`text-lg font-bold ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`} style={{ fontFamily: 'serif' }}>{item.qty}</Text>
                </View>
                <View className="flex-1 items-start">
                  <Text className="text-[10px] text-gray-600 font-bold tracking-wider mb-1">PRICE</Text>
                  <Text className={`text-lg font-bold ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`} style={{ fontFamily: 'serif' }}>{item.price}</Text>
                </View>
              </View>

              {item.left !== '' && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 bg-gray-200 h-2 rounded-full mr-4">
                    <View 
                      className={`h-2 rounded-full ${isSoldOut ? 'bg-gray-400' : (isPending ? 'bg-[#f5dbba]' : 'bg-[#0f6b4b]')}`}
                      style={{ width: `${item.progress * 100}%` }}
                    />
                  </View>
                  <Text className="text-xs font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{item.left}</Text>
                </View>
              )}
            </View>
          );
        })}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
