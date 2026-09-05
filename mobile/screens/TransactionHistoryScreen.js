import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export default function TransactionHistoryScreen({ navigation, route }) {
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'Purchases');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  // Fallback dummy data if backend fails
  const dummyPurchases = [
    {
      _id: 'TR-8921',
      createdAt: '2023-10-24T10:00:00Z',
      status: 'Completed',
      purchasedQuantity: 45.0,
      agreedUnitPrice: 45.00,
      totalAmount: 2025.00
    },
    {
      _id: 'TR-8845',
      createdAt: '2023-10-20T10:00:00Z',
      status: 'Completed',
      purchasedQuantity: 12.5,
      agreedUnitPrice: 48.00,
      totalAmount: 600.00
    },
    {
      _id: 'TR-8712',
      createdAt: '2023-10-15T10:00:00Z',
      status: 'Completed',
      purchasedQuantity: 60.0,
      agreedUnitPrice: 42.50,
      totalAmount: 2550.00
    }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/energy/orders/my');
      setOrders(res.data.data);
    } catch (error) {
      console.error(error);
      // Fallback to dummy data
      setOrders(dummyPurchases);
    } finally {
      setLoading(false);
    }
  };

  const purchases = orders.filter(o => o.buyerId?.email === 'user@solarcoop.com' || !o.buyerId);
  const sales = orders.filter(o => o.sellerId?.email === 'user@solarcoop.com');

  const transactions = activeTab === 'Purchases' ? purchases : sales;

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
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

      <View className="pt-6 px-4 pb-4">
        <Text className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>Transaction History</Text>
        <Text className="text-gray-600 mb-2 text-sm">Review your past energy purchases and sales.</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 border-b border-gray-300">
        <TouchableOpacity 
          className={`flex-1 pb-3 items-center border-b-2 ${activeTab === 'Purchases' ? 'border-[#0f6b4b]' : 'border-transparent'}`}
          onPress={() => setActiveTab('Purchases')}
        >
          <Text className={`font-bold text-sm ${activeTab === 'Purchases' ? 'text-[#0f6b4b]' : 'text-gray-500'}`}>Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 pb-3 items-center border-b-2 ${activeTab === 'Sales' ? 'border-[#0f6b4b]' : 'border-transparent'}`}
          onPress={() => setActiveTab('Sales')}
        >
          <Text className={`font-bold text-sm ${activeTab === 'Sales' ? 'text-[#0f6b4b]' : 'text-gray-500'}`}>Sales</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {loading ? (
          <View className="mt-10 items-center justify-center">
            <ActivityIndicator size="large" color="#0f6b4b" />
          </View>
        ) : (
          <>
            {transactions.map((tx, index) => {
              const formattedDate = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const shortId = tx._id.toString().startsWith('TR-') ? tx._id : `TR-${tx._id.toString().slice(-4).toUpperCase()}`;
              
              return (
                <View key={index} className="bg-white rounded-2xl p-5 mb-4 border border-gray-200 shadow-sm">
                  <View className="flex-row justify-between items-start mb-3">
                    <View>
                      <Text className="text-base font-bold text-gray-900 mb-1">{formattedDate}</Text>
                      <Text className="text-xs text-gray-500 font-semibold">ID: {shortId}</Text>
                    </View>
                    <View className="bg-[#dce9e1] px-2.5 py-1 rounded-full flex-row items-center border border-[#c6d8ce]">
                      <MaterialCommunityIcons name="check-circle-outline" size={14} color="#333" className="mr-1" />
                      <Text className="text-xs text-gray-800 font-semibold">Completed</Text>
                    </View>
                  </View>

                  <View className="h-[1px] bg-gray-200 mb-4 mt-1" />

                  <View className="flex-row mb-5">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-700 font-semibold mb-2">Energy</Text>
                      <Text className="text-base font-bold text-gray-900">{parseFloat(tx.purchasedQuantity).toFixed(1)} kWh</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-700 font-semibold mb-2">Price per kWh</Text>
                      <Text className="text-base text-gray-700">{parseFloat(tx.agreedUnitPrice).toFixed(2)} LKR</Text>
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs text-gray-700 font-semibold mb-2">Total Amount</Text>
                    <Text className="text-3xl font-bold text-[#0f6b4b]" style={{ fontFamily: 'serif' }}>
                      {parseFloat(tx.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LKR
                    </Text>
                  </View>
                </View>
              );
            })}

            {transactions.length === 0 && (
              <View className="items-center justify-center mt-10">
                 <MaterialCommunityIcons name="receipt-outline" size={64} color="#ccc" className="mb-4" />
                 <Text className="text-gray-500 font-semibold">No {activeTab.toLowerCase()} found.</Text>
              </View>
            )}
          </>
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
