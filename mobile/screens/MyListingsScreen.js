import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export default function MyListingsScreen({ navigation }) {
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Active'); // 'Active' | 'Pending' | 'History'
  const [dbListings, setDbListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };

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
        const mapped = res.data.data.map((item, idx) => {
          const approvedQty = Number(item.approvedQuantity !== undefined ? item.approvedQuantity : 0);
          const pendingQty = Number(item.pendingQuantity !== undefined ? item.pendingQuantity : 0);
          const totalQty = approvedQty > 0 ? approvedQty : pendingQty;
          const price = item.approvedUnitPrice > 0 ? item.approvedUnitPrice : (item.pendingUnitPrice || 0);

          let normStatus = 'ACTIVE';
          if (item.status === 'PENDING_APPROVAL' || item.status === 'PENDING APPROVAL') {
            normStatus = 'PENDING APPROVAL';
          } else if (
            item.status === 'SOLD_OUT' || 
            item.status === 'SOLD OUT' || 
            item.status === 'COMPLETED' || 
            (approvedQty <= 0 && item.status !== 'PENDING_APPROVAL' && item.status !== 'DECLINED')
          ) {
            normStatus = 'SOLD OUT';
          } else if (item.status === 'DECLINED') {
            normStatus = 'DECLINED';
          } else if (item.status === 'CANCELLED') {
            normStatus = 'CANCELLED';
          } else {
            normStatus = 'ACTIVE';
          }

          const isSold = normStatus === 'SOLD OUT';
          const isPending = normStatus === 'PENDING APPROVAL';

          return {
            id: item._id || `db-${idx}`,
            title: item.description ? (item.description.length > 25 ? item.description.slice(0, 25) + '...' : item.description) : `Solar Share - ${totalQty} kWh`,
            description: item.description || 'Excess residential solar energy allocation.',
            status: normStatus,
            qty: `${totalQty} ${item.approvedUnit || item.pendingUnit || 'kWh'}`,
            price: `${price} LKR/kWh`,
            progress: isSold ? 1 : (isPending ? 0 : 0.7),
            left: isSold ? '' : (isPending ? 'Awaiting review' : `${approvedQty} kWh left`)
          };
        });
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
  
  // Filter for separate sections: Active, Pending, History
  const activeListings = combinedListings.filter(l => l.status === 'ACTIVE');
  const pendingListings = combinedListings.filter(l => l.status === 'PENDING APPROVAL');
  const historyListings = combinedListings.filter(
    l => l.status === 'SOLD OUT' || l.status === 'COMPLETED' || l.status === 'DECLINED' || l.status === 'CANCELLED'
  );
  
  const displayedListings = 
    activeTab === 'Active' ? activeListings :
    activeTab === 'Pending' ? pendingListings : historyListings;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')} 
            className="mr-3 flex-row items-center"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0f6b4b" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="solar-panel-large" size={20} color="#0f6b4b" />
          <Text className="text-xl font-bold ml-2 text-gray-900" style={{ fontFamily: 'serif' }}>Solar Share</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#0f6b4b" />
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

        {/* Custom Tabs: Separate Active, Pending, and History */}
        <View className="flex-row border-b border-gray-200 mb-4">
          <TouchableOpacity 
            className={`pb-3 px-3 mr-3 flex-row items-center ${activeTab === 'Active' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('Active')}
          >
            <Text className={`font-bold mr-1.5 text-sm ${activeTab === 'Active' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>Active</Text>
            <View className={`rounded-full h-5 px-1.5 items-center justify-center ${activeTab === 'Active' ? 'bg-[#dcefe5]' : 'bg-gray-200'}`}>
              <Text className={`text-[10px] font-bold ${activeTab === 'Active' ? 'text-[#0f6b4b]' : 'text-gray-600'}`}>{activeListings.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`pb-3 px-3 mr-3 flex-row items-center ${activeTab === 'Pending' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('Pending')}
          >
            <Text className={`font-bold mr-1.5 text-sm ${activeTab === 'Pending' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>Pending</Text>
            <View className={`rounded-full h-5 px-1.5 items-center justify-center ${activeTab === 'Pending' ? 'bg-[#ffeedd]' : 'bg-gray-200'}`}>
              <Text className={`text-[10px] font-bold ${activeTab === 'Pending' ? 'text-orange-800' : 'text-gray-600'}`}>{pendingListings.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`pb-3 px-3 flex-row items-center ${activeTab === 'History' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('History')}
          >
            <Text className={`font-bold mr-1.5 text-sm ${activeTab === 'History' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>History</Text>
            <View className={`rounded-full h-5 px-1.5 items-center justify-center ${activeTab === 'History' ? 'bg-gray-300' : 'bg-gray-200'}`}>
              <Text className="text-[10px] text-gray-600 font-bold">{historyListings.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 bg-[#f9f9f9]">
        {loading ? (
          <ActivityIndicator size="large" color="#0f6b4b" className="mt-10" />
        ) : displayedListings.length === 0 ? (
          <View className="items-center justify-center py-12 px-4 bg-white rounded-2xl border border-gray-200 my-4">
            <MaterialCommunityIcons 
              name={
                activeTab === 'Active' ? 'solar-power' : 
                activeTab === 'Pending' ? 'clock-outline' : 'history'
              } 
              size={40} 
              color="#9ca3af" 
              className="mb-3" 
            />
            <Text className="text-base font-bold text-gray-800 mb-1" style={{ fontFamily: 'serif' }}>
              No {activeTab} Listings
            </Text>
            <Text className="text-xs text-gray-500 text-center mb-4 leading-5 px-4">
              {activeTab === 'Active'
                ? 'You have no active energy listings right now. Click "Create New Listing" to share surplus energy with the community.'
                : activeTab === 'Pending'
                ? 'You have no listings waiting for co-op administrator review.'
                : 'Sold out and completed energy listings will appear here.'}
            </Text>
            {activeTab === 'Active' && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('SellEnergy')}
                className="bg-[#0f6b4b] px-4 py-2 rounded-lg flex-row items-center"
              >
                <MaterialCommunityIcons name="plus" size={14} color="#fff" className="mr-1.5" />
                <Text className="text-white text-xs font-bold">Create New Listing</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayedListings.map(item => {
          const isSoldOut = item.status === 'SOLD OUT';
          const isPending = item.status === 'PENDING APPROVAL';
          const isDeclined = item.status === 'DECLINED' || item.status === 'CANCELLED';
          
          let statusBg = 'bg-green-100';
          let statusText = 'text-[#0f6b4b]';
          let icon = 'check-decagram';
          
          if (isPending) {
            statusBg = 'bg-orange-100';
            statusText = 'text-orange-800';
            icon = 'clock-outline';
          } else if (isSoldOut) {
            statusBg = 'bg-gray-200';
            statusText = 'text-gray-600';
            icon = 'close-box-outline';
          } else if (isDeclined) {
            statusBg = 'bg-red-100';
            statusText = 'text-red-700';
            icon = 'alert-circle-outline';
          }

          const iconColor = isPending ? '#9a3412' : (isSoldOut ? '#4b5563' : (isDeclined ? '#b91c1c' : '#0f6b4b'));

          return (
            <View key={item.id} className="bg-white rounded-xl p-5 mb-4 border border-gray-200 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View className={`${statusBg} px-2 py-1 rounded-full flex-row items-center`}>
                  <MaterialCommunityIcons name={icon} size={12} color={iconColor} />
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
        }))}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
