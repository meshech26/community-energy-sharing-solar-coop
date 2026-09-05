import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export default function AdminApprovalsScreen({ navigation }) {
  const { user } = useAuthStore();
  const isCoopAdmin = Boolean(user?.isCoopAdmin);
  const [activeTab, setActiveTab] = useState('New Listings');
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultPendingListings = [
    {
      _id: 'default-1',
      sellerId: { name: 'Amal Silva' },
      initials: 'AS',
      householdId: '#H-293',
      tag: 'New Seller',
      pendingQuantity: 10,
      pendingUnit: 'kWh',
      pendingUnitPrice: 45.00,
    },
    {
      _id: 'default-2',
      sellerId: { name: 'Nimali Perera' },
      initials: 'NP',
      householdId: '#H-112',
      pendingQuantity: 25,
      pendingUnit: 'kWh',
      pendingUnitPrice: 42.50,
    },
    {
      _id: 'default-3',
      sellerId: { name: 'Kasun Wijesinghe' },
      initials: 'KW',
      householdId: '#H-054',
      tag: 'High Rate',
      tagColor: 'bg-red-100 text-red-700',
      pendingQuantity: 5,
      pendingUnit: 'kWh',
      pendingUnitPrice: 55.00,
      warning: 'Exceeds recommended community rate by 15%',
      isEdited: false
    },
    {
      _id: 'default-4',
      sellerId: { name: 'Sunil Jayawardena' },
      initials: 'SJ',
      householdId: '#H-301',
      pendingQuantity: 18,
      pendingUnit: 'kWh',
      pendingUnitPrice: 44.00,
      previousQuantity: 15,
      previousUnitPrice: 48.00,
      description: 'Adjusted rate for cooperative members',
      isEdited: true
    }
  ];

  const newListings = pendingListings.filter(l => !l.isEdited);
  const editListings = pendingListings.filter(l => Boolean(l.isEdited));

  const fetchPendingListings = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/energy/admin/pending');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setPendingListings(res.data.data);
      } else {
        setPendingListings(defaultPendingListings);
      }
    } catch (e) {
      console.error(e);
      setPendingListings(defaultPendingListings);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPendingListings();
    }, [])
  );

  const handleApprove = async (item) => {
    try {
      if (item._id && !item._id.startsWith('default-')) {
        await axios.put(`http://127.0.0.1:5000/api/energy/admin/listings/${item._id}/approve`);
      }
      // Remove from list immediately
      setPendingListings(prev => prev.filter(l => l._id !== item._id));

      const msg = `Listing for ${item.pendingQuantity || item.energyAmount || 'energy'} has been approved and is now live on the marketplace!`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Approved', msg);
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') {
        window.alert('Failed to approve listing.');
      } else {
        Alert.alert('Error', 'Failed to approve listing.');
      }
    }
  };

  const handleDecline = async (item) => {
    try {
      if (item._id && !item._id.startsWith('default-')) {
        await axios.put(`http://127.0.0.1:5000/api/energy/admin/listings/${item._id}/decline`, {
          reason: 'Rate exceeds community standards'
        });
      }
      // Remove from list immediately
      setPendingListings(prev => prev.filter(l => l._id !== item._id));

      if (Platform.OS === 'web') {
        window.alert('Listing has been declined.');
      } else {
        Alert.alert('Declined', 'Listing has been declined.');
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') {
        window.alert('Failed to decline listing.');
      } else {
        Alert.alert('Error', 'Failed to decline listing.');
      }
    }
  };

  if (!isCoopAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 flex-row items-center">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0f6b4b" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Access Restricted</Text>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-red-100 p-4 rounded-full mb-4">
            <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#dc2626" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: 'serif' }}>
            Administrator Access Only
          </Text>
          <Text className="text-gray-600 text-sm text-center mb-6 leading-5">
            Admin Approvals and the ability to Approve / Decline energy trades is reserved for cooperative administrators (isCoopAdmin: true).
          </Text>

          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-full bg-[#0f6b4b] py-3.5 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-base">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 flex-row items-center">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0f6b4b" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="solar-panel-large" size={20} color="#0f6b4b" />
          <Text className="text-xl font-bold ml-2 text-gray-900" style={{ fontFamily: 'serif' }}>Solar Share</Text>
        </View>
      </View>

      <View className="bg-gray-50 pt-6 px-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'serif' }}>Energy Listing Approvals</Text>
        <Text className="text-gray-600 mb-6 text-sm leading-5">Review and authorize community energy trades.</Text>

        {/* Custom Tabs */}
        <View className="flex-row border-b border-gray-200 mb-6">
          <TouchableOpacity 
            className={`pb-3 px-2 mr-6 ${activeTab === 'New Listings' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('New Listings')}
          >
            <Text className={`font-semibold ${activeTab === 'New Listings' ? 'text-[#0f6b4b]' : 'text-gray-500'}`}>New Listings ({newListings.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`pb-3 px-2 ${activeTab === 'Edits' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('Edits')}
          >
            <Text className={`font-semibold ${activeTab === 'Edits' ? 'text-[#0f6b4b]' : 'text-gray-500'}`}>Edits Awaiting Approval ({editListings.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {loading ? (
          <ActivityIndicator size="large" color="#0f6b4b" className="mt-10" />
        ) : activeTab === 'New Listings' ? (
          newListings.map(item => {
            const sellerName = item.sellerId?.name || item.name || 'Local Seller';
            const initials = item.initials || sellerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const householdId = item.householdId || '#H-098';
            const quantity = `${item.pendingQuantity ?? item.approvedQuantity ?? 10} ${item.pendingUnit || 'kWh'}`;
            const rate = `LKR ${(item.pendingUnitPrice ?? 45).toFixed(2)}/kWh`;

            return (
              <View key={item._id} className="bg-white rounded-xl p-5 mb-4 border border-gray-200 shadow-sm">
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center">
                    <View className="bg-gray-200 h-10 w-10 rounded-full items-center justify-center mr-3">
                      <Text className="text-gray-600 font-bold text-sm">{initials}</Text>
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{sellerName}</Text>
                      <Text className="text-xs text-gray-500">Household ID: {householdId}</Text>
                    </View>
                  </View>
                  {item.tag && (
                    <View className={`${item.tagColor || 'bg-gray-200'} px-2 py-1 rounded-full`}>
                      {item.tag === 'High Rate' ? (
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="alert-outline" size={12} color="#b91c1c" className="mr-1" />
                          <Text className="text-[10px] text-red-700 font-semibold">{item.tag}</Text>
                        </View>
                      ) : (
                        <Text className="text-[10px] text-gray-700 font-semibold">{item.tag}</Text>
                      )}
                    </View>
                  )}
                </View>

                <View className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm font-semibold text-gray-600">Energy Amount</Text>
                    <Text className="text-base font-bold text-gray-900">{quantity}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-semibold text-gray-600">Proposed Rate</Text>
                    <Text className={`text-base font-bold ${item.warning ? 'text-red-600' : 'text-[#0f6b4b]'}`}>{rate}</Text>
                  </View>
                  {item.description ? (
                    <Text className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200 italic">"{item.description}"</Text>
                  ) : null}
                  {item.warning && (
                    <Text className="text-[10px] text-gray-500 mt-3 pt-3 border-t border-gray-200">{item.warning}</Text>
                  )}
                </View>

                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    className="flex-1 border border-red-600 rounded-lg py-3 mr-2 flex-row justify-center items-center"
                    onPress={() => handleDecline(item)}
                  >
                    <MaterialCommunityIcons name="close" size={18} color="#dc2626" />
                    <Text className="text-red-600 font-bold ml-1">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 bg-[#0f6b4b] rounded-lg py-3 ml-2 flex-row justify-center items-center"
                    onPress={() => handleApprove(item)}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                    <Text className="text-white font-bold ml-1">Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          editListings.map(item => {
            const sellerName = item.sellerId?.name || item.name || 'Local Seller';
            const initials = item.initials || sellerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const householdId = item.householdId || '#H-098';
            const quantity = `${item.pendingQuantity ?? item.approvedQuantity ?? 10} ${item.pendingUnit || 'kWh'}`;
            const rate = `LKR ${(item.pendingUnitPrice ?? 45).toFixed(2)}/kWh`;

            const hasPrevQuantity = item.previousQuantity !== undefined && item.previousQuantity !== null;
            const hasPrevRate = item.previousUnitPrice !== undefined && item.previousUnitPrice !== null;

            return (
              <View key={item._id} className="bg-white rounded-xl p-5 mb-4 border border-amber-200 shadow-sm">
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="bg-amber-100 h-10 w-10 rounded-full items-center justify-center mr-3">
                      <Text className="text-amber-800 font-bold text-sm">{initials}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{sellerName}</Text>
                      <Text className="text-xs text-gray-500">Household ID: {householdId}</Text>
                    </View>
                  </View>
                  <View className="bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full flex-row items-center">
                    <MaterialCommunityIcons name="pencil" size={12} color="#b45309" style={{ marginRight: 4 }} />
                    <Text className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">EDITED - PENDING REVIEW</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm font-semibold text-gray-600">Energy Amount</Text>
                    <View className="items-end">
                      <Text className="text-base font-bold text-gray-900">{quantity}</Text>
                      {hasPrevQuantity && item.previousQuantity !== item.pendingQuantity && (
                        <Text className="text-xs text-gray-400 line-through">
                          Was: {item.previousQuantity} {item.pendingUnit || 'kWh'}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-semibold text-gray-600">Proposed Rate</Text>
                    <View className="items-end">
                      <Text className="text-base font-bold text-[#0f6b4b]">{rate}</Text>
                      {hasPrevRate && item.previousUnitPrice !== item.pendingUnitPrice && (
                        <Text className="text-xs text-gray-400 line-through">
                          Was: LKR {Number(item.previousUnitPrice).toFixed(2)}/kWh
                        </Text>
                      )}
                    </View>
                  </View>

                  {item.description ? (
                    <Text className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200 italic">"{item.description}"</Text>
                  ) : null}
                </View>

                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    className="flex-1 border border-red-600 rounded-lg py-3 mr-2 flex-row justify-center items-center"
                    onPress={() => handleDecline(item)}
                  >
                    <MaterialCommunityIcons name="close" size={18} color="#dc2626" />
                    <Text className="text-red-600 font-bold ml-1">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 bg-[#0f6b4b] rounded-lg py-3 ml-2 flex-row justify-center items-center"
                    onPress={() => handleApprove(item)}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                    <Text className="text-white font-bold ml-1">Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {activeTab === 'New Listings' && newListings.length === 0 && !loading && (
          <View className="items-center justify-center mt-10">
            <MaterialCommunityIcons name="check-circle-outline" size={48} color="#0f6b4b" className="mb-2" />
            <Text className="text-gray-600 font-medium">No new listings to review.</Text>
          </View>
        )}

        {activeTab === 'Edits' && editListings.length === 0 && !loading && (
          <View className="items-center justify-center mt-10">
            <MaterialCommunityIcons name="file-document-edit-outline" size={48} color="#9ca3af" className="mb-2" />
            <Text className="text-gray-600 font-medium">No edits currently awaiting approval.</Text>
          </View>
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

