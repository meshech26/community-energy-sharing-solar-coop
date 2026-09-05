import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export default function MyListingsScreen({ navigation }) {
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Active'); // 'Active' | 'Pending' | 'Declined' | 'History'
  const [dbListings, setDbListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Persistent Deleted Listing IDs
  const STORAGE_DELETED_KEY = '@solarcoop_deleted_listing_ids';

  const getStoredDeletedIds = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_DELETED_KEY);
        return stored ? JSON.parse(stored) : [];
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
    return [];
  };

  const saveStoredDeletedId = (id) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const current = getStoredDeletedIds();
        if (!current.includes(id)) {
          window.localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify([...current, id]));
        }
      }
    } catch (e) {
      console.warn('Storage write error:', e);
    }
  };

  const [deletedIds, setDeletedIds] = useState(() => getStoredDeletedIds());

  // Action Menu State (for 3-dots)
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuItem, setActionMenuItem] = useState(null);

  const initialDefaultListings = [
    {
      id: 'default-1',
      title: 'Solar Excess - Weekend',
      description: 'Generated from rooftop panels.',
      status: 'ACTIVE',
      listedQty: '50 kWh',
      availableQty: '20 kWh',
      price: '35 LKR/kWh',
      progress: 0.4,
      left: '20 kWh left'
    },
    {
      id: 'default-2',
      title: 'Wind Energy Share',
      description: 'Community turbine allocation.',
      status: 'PENDING APPROVAL',
      listedQty: '120 kWh',
      availableQty: '0 kWh',
      price: '30 LKR/kWh',
      progress: 0,
      left: 'Awaiting review'
    },
    {
      id: 'default-3',
      title: 'Evening Peak Battery',
      description: 'Stored energy from daily solar.',
      status: 'ACTIVE',
      listedQty: '15 kWh',
      availableQty: '1.5 kWh',
      price: '45 LKR/kWh',
      progress: 0.1,
      left: '1.5 kWh left'
    },
    {
      id: 'default-4',
      title: 'Morning Solar Burst',
      description: 'Clear sky generation.',
      status: 'SOLD OUT',
      listedQty: '30 kWh',
      availableQty: '0 kWh',
      price: '32 LKR/kWh',
      progress: 0,
      left: ''
    }
  ];

  const [mockListings, setMockListings] = useState(initialDefaultListings);

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };

  const handleOpenEdit = (item) => {
    const rawQty = item.listedQty ? parseFloat(item.listedQty) : 10;
    const rawPrice = item.price ? parseFloat(item.price) : 45;
    setEditingListing(item);
    setEditQuantity(String(rawQty || ''));
    setEditPrice(String(rawPrice || ''));
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    const qtyNum = parseFloat(editQuantity);
    const priceNum = parseFloat(editPrice);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a valid energy quantity greater than 0.');
      } else {
        Alert.alert('Invalid Quantity', 'Please enter a valid energy quantity greater than 0.');
      }
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a valid unit price greater than 0.');
      } else {
        Alert.alert('Invalid Price', 'Please enter a valid unit price greater than 0.');
      }
      return;
    }

    setSavingEdit(true);
    try {
      if (editingListing.id && !editingListing.id.startsWith('default-')) {
        await axios.put(`http://127.0.0.1:5000/api/energy/listings/${editingListing.id}`, {
          quantity: qtyNum,
          unitPrice: priceNum
        });
      } else {
        // Mock update for default listings
        setMockListings(prev => prev.map(l => {
          if (l.id === editingListing.id) {
            return {
              ...l,
              status: 'PENDING APPROVAL',
              listedQty: `${qtyNum} kWh`,
              availableQty: '0 kWh',
              price: `${priceNum} LKR/kWh`,
              progress: 0,
              left: 'Awaiting review',
              declineReason: undefined
            };
          }
          return l;
        }));
      }

      setEditModalVisible(false);
      await fetchMyListings();

      // Immediately navigate user to the Pending tab
      setActiveTab('Pending');

      if (Platform.OS === 'web') {
        window.alert('Your listing has been successfully updated and moved to Pending for cooperative administrator review.');
      } else {
        Alert.alert(
          'Listing Updated',
          'Your listing has been successfully updated and moved to Pending for cooperative administrator review.'
        );
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert(err.response?.data?.error || 'Failed to update listing. Please try again.');
      } else {
        Alert.alert('Update Failed', err.response?.data?.error || 'Failed to update listing. Please try again.');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteListing = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDeleteListing = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    const deleteId = itemToDelete.id;
    const deletedTitle = itemToDelete.title;

    try {
      if (deleteId && !deleteId.startsWith('default-')) {
        await axios.delete(`http://127.0.0.1:5000/api/energy/listings/${deleteId}`);
        setDbListings(prev => prev.filter(l => l.id !== deleteId));
      } else {
        setMockListings(prev => prev.filter(l => l.id !== deleteId));
      }

      // Persist deleted ID in localStorage so it never returns on refresh
      saveStoredDeletedId(deleteId);
      setDeletedIds(prev => [...prev, deleteId]);

      setDeleteModalVisible(false);
      setItemToDelete(null);
      await fetchMyListings();

      if (Platform.OS === 'web') {
        window.alert(`"${deletedTitle}" has been deleted`);
      } else {
        Alert.alert('Listing Deleted', `"${deletedTitle}" has been deleted`);
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert(err.response?.data?.error || 'Failed to delete listing.');
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Failed to delete listing.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/energy/listings/my');
      if (res.data?.data) {
        const mapped = res.data.data.map((item, idx) => {
          const unit = item.approvedUnit || item.pendingUnit || 'kWh';
          const listedQuantity = Number(item.listedQuantity > 0 
            ? item.listedQuantity 
            : (item.pendingQuantity > 0 ? item.pendingQuantity : (item.approvedQuantity || 0)));
          const availableQuantity = Number(item.availableQuantity !== undefined 
            ? item.availableQuantity 
            : (item.approvedQuantity !== undefined ? item.approvedQuantity : 0));
          const price = item.approvedUnitPrice > 0 ? item.approvedUnitPrice : (item.pendingUnitPrice || 0);

          let normStatus = 'ACTIVE';
          if (item.status === 'PENDING_APPROVAL' || item.status === 'PENDING APPROVAL') {
            normStatus = 'PENDING APPROVAL';
          } else if (
            item.status === 'SOLD_OUT' || 
            item.status === 'SOLD OUT' || 
            item.status === 'COMPLETED' || 
            (availableQuantity <= 0 && item.status !== 'PENDING_APPROVAL' && item.status !== 'DECLINED')
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
          const isActive = normStatus === 'ACTIVE';

          const progress = listedQuantity > 0 ? Math.min(1, Math.max(0, availableQuantity / listedQuantity)) : 0;

          return {
            id: item._id || `db-${idx}`,
            title: item.description ? (item.description.length > 25 ? item.description.slice(0, 25) + '...' : item.description) : `Solar Share - ${listedQuantity} kWh`,
            description: item.description || 'Excess residential solar energy allocation.',
            status: normStatus,
            listedQty: `${listedQuantity} ${unit}`,
            availableQty: `${availableQuantity} ${unit}`,
            price: `${price} LKR/kWh`,
            progress: progress,
            left: isActive ? `${availableQuantity} kWh left` : (isPending ? 'Awaiting review' : ''),
            declineReason: item.declineReason
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

  // Combine database listings with default mock listings, strictly excluding any deleted listings
  const combinedListings = [...dbListings, ...mockListings].filter(l => !deletedIds.includes(l.id));
  
  // Filter for separate sections: Active, Pending, Declined, History
  const activeListings = combinedListings.filter(l => l.status === 'ACTIVE');
  const pendingListings = combinedListings.filter(l => l.status === 'PENDING APPROVAL');
  const declinedListings = combinedListings.filter(l => l.status === 'DECLINED');
  const historyListings = combinedListings.filter(
    l => l.status === 'SOLD OUT' || l.status === 'COMPLETED' || l.status === 'CANCELLED'
  );
  
  const displayedListings = 
    activeTab === 'Active' ? activeListings :
    activeTab === 'Pending' ? pendingListings :
    activeTab === 'Declined' ? declinedListings : historyListings;

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

        {/* Custom Tabs: Separate Active, Pending, Declined, and History */}
        <View className="flex-row border-b border-gray-200 mb-4">
          <TouchableOpacity 
            className={`pb-3 px-2.5 mr-2 flex-row items-center ${activeTab === 'Active' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('Active')}
          >
            <Text className={`font-bold mr-1 text-xs ${activeTab === 'Active' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>Active</Text>
            <View className={`rounded-full h-5 px-1.5 items-center justify-center ${activeTab === 'Active' ? 'bg-[#dcefe5]' : 'bg-gray-200'}`}>
              <Text className={`text-[10px] font-bold ${activeTab === 'Active' ? 'text-[#0f6b4b]' : 'text-gray-600'}`}>{activeListings.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`pb-3 px-2.5 mr-2 flex-row items-center ${activeTab === 'Pending' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('Pending')}
          >
            <Text className={`font-bold mr-1 text-xs ${activeTab === 'Pending' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>Pending</Text>
            <View className={`rounded-full h-5 px-1.5 items-center justify-center ${activeTab === 'Pending' ? 'bg-[#ffeedd]' : 'bg-gray-200'}`}>
              <Text className={`text-[10px] font-bold ${activeTab === 'Pending' ? 'text-orange-800' : 'text-gray-600'}`}>{pendingListings.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`pb-3 px-2.5 mr-2 flex-row items-center ${activeTab === 'Declined' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('Declined')}
          >
            <Text className={`font-bold mr-1 text-xs ${activeTab === 'Declined' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>Declined</Text>
            <View className={`rounded-full h-5 px-1.5 items-center justify-center ${activeTab === 'Declined' ? 'bg-[#fee2e2]' : 'bg-gray-200'}`}>
              <Text className={`text-[10px] font-bold ${activeTab === 'Declined' ? 'text-red-700' : 'text-gray-600'}`}>{declinedListings.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`pb-3 px-2.5 flex-row items-center ${activeTab === 'History' ? 'border-b-2 border-[#0f6b4b]' : ''}`}
            onPress={() => setActiveTab('History')}
          >
            <Text className={`font-bold mr-1 text-xs ${activeTab === 'History' ? 'text-[#0f6b4b]' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }}>History</Text>
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
                activeTab === 'Pending' ? 'clock-outline' :
                activeTab === 'Declined' ? 'alert-circle-outline' : 'history'
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
                : activeTab === 'Declined'
                ? 'You have no declined listings. Any listings declined by the co-op administrator will appear here for adjustments.'
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
                <TouchableOpacity onPress={() => {
                  if (item.status === 'PENDING APPROVAL' || item.status === 'DECLINED') {
                    setActionMenuItem(item);
                    setActionMenuVisible(true);
                  }
                }}>
                  <MaterialCommunityIcons name="dots-vertical" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <Text className={`text-xl font-bold mb-1 ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`} style={{ fontFamily: 'serif' }}>{item.title}</Text>
              <Text className="text-sm text-gray-500 mb-4">{item.description}</Text>

              {item.declineReason ? (
                <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex-row items-start">
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#b91c1c" className="mr-2 mt-0.5" />
                  <Text className="text-xs text-red-700 flex-1 leading-4">
                    <Text className="font-bold">Decline reason: </Text>{item.declineReason}
                  </Text>
                </View>
              ) : null}

              {item.status === 'ACTIVE' ? (
                <View className="bg-[#f4f4f4] rounded-xl p-4 mb-4 flex-row border border-gray-100">
                  <View className="flex-1">
                    <Text className="text-[10px] text-gray-600 font-bold tracking-wider mb-1">LISTED QTY</Text>
                    <Text className="text-base font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{item.listedQty}</Text>
                  </View>
                  <View className="flex-1 items-start">
                    <Text className="text-[10px] text-gray-600 font-bold tracking-wider mb-1">AVAILABLE QTY</Text>
                    <Text className="text-base font-bold text-[#0f6b4b]" style={{ fontFamily: 'serif' }}>{item.availableQty}</Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-[10px] text-gray-600 font-bold tracking-wider mb-1">PRICE</Text>
                    <Text className="text-base font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{item.price}</Text>
                  </View>
                </View>
              ) : (
                <View className="bg-[#f4f4f4] rounded-xl p-4 mb-4 flex-row border border-gray-100">
                  <View className="flex-1">
                    <Text className="text-[10px] text-gray-600 font-bold tracking-wider mb-1">LISTED QTY</Text>
                    <Text className={`text-lg font-bold ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`} style={{ fontFamily: 'serif' }}>{item.listedQty}</Text>
                  </View>
                  <View className="flex-1 items-start">
                    <Text className="text-[10px] text-gray-600 font-bold tracking-wider mb-1">PRICE</Text>
                    <Text className={`text-lg font-bold ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`} style={{ fontFamily: 'serif' }}>{item.price}</Text>
                  </View>
                </View>
              )}

              {item.left !== '' && !isSoldOut && (
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-1 bg-gray-200 h-2 rounded-full mr-4">
                    <View 
                      className={`h-2 rounded-full ${isPending ? 'bg-[#f5dbba]' : 'bg-[#0f6b4b]'}`}
                      style={{ width: `${item.progress * 100}%` }}
                    />
                  </View>
                  <Text className="text-xs font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{item.left}</Text>
                </View>
              )}

              {(item.status === 'PENDING APPROVAL' || item.status === 'DECLINED') && (
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity 
                    onPress={() => handleOpenEdit(item)}
                    className="flex-1 bg-[#eef6f1] border border-[#0f6b4b] rounded-xl py-2.5 px-3 flex-row items-center justify-center shadow-xs"
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={16} color="#0f6b4b" className="mr-1.5" />
                    <Text className="text-[#0f6b4b] font-bold text-xs" style={{ fontFamily: 'serif' }}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleDeleteListing(item)}
                    className="bg-red-50 border border-red-200 rounded-xl py-2.5 px-3 flex-row items-center justify-center shadow-xs"
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#dc2626" className="mr-1" />
                    <Text className="text-red-700 font-bold text-xs" style={{ fontFamily: 'serif' }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }))}
        <View className="h-10" />
      </ScrollView>

      {/* Edit Listing Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="bg-[#e2efe8] p-2 rounded-full mr-3">
                  <MaterialCommunityIcons name="playlist-edit" size={22} color="#0f6b4b" />
                </View>
                <View>
                  <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Edit Listing</Text>
                  <Text className="text-xs text-gray-500">Update energy quantity and price</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                className="p-1.5 rounded-full bg-gray-100"
              >
                <MaterialCommunityIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Editing item preview */}
            {editingListing && (
              <View className="bg-[#f9fafb] p-3.5 rounded-xl border border-gray-200 mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-bold text-gray-900 text-sm flex-1 mr-2" numberOfLines={1} style={{ fontFamily: 'serif' }}>
                    {editingListing.title}
                  </Text>
                  <View className={`px-2 py-0.5 rounded ${editingListing.status === 'DECLINED' ? 'bg-red-100' : 'bg-orange-100'}`}>
                    <Text className={`text-[9px] font-bold ${editingListing.status === 'DECLINED' ? 'text-red-700' : 'text-orange-800'}`}>
                      {editingListing.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500" numberOfLines={2}>
                  {editingListing.description}
                </Text>
                {editingListing.declineReason && (
                  <Text className="text-[11px] text-red-600 font-semibold mt-2">
                    Note: {editingListing.declineReason}
                  </Text>
                )}
              </View>
            )}

            {/* Quantity Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-700 mb-1.5">Energy Quantity</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5">
                <MaterialCommunityIcons name="lightning-bolt" size={18} color="#0f6b4b" className="mr-2" />
                <TextInput
                  value={editQuantity}
                  onChangeText={setEditQuantity}
                  keyboardType="numeric"
                  placeholder="e.g. 10"
                  className="flex-1 text-sm font-bold text-gray-900"
                />
                <Text className="text-xs font-bold text-gray-500">kWh</Text>
              </View>
            </View>

            {/* Price Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-700 mb-1.5">Unit Price</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5">
                <MaterialCommunityIcons name="cash" size={18} color="#0f6b4b" className="mr-2" />
                <TextInput
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 45"
                  className="flex-1 text-sm font-bold text-gray-900"
                />
                <Text className="text-xs font-bold text-gray-500">LKR / kWh</Text>
              </View>
            </View>

            {/* Summary preview */}
            <View className="bg-[#f0f7f3] p-3 rounded-xl border border-[#cde5d7] mb-4 flex-row justify-between items-center">
              <Text className="text-xs text-gray-700 font-semibold">Total Estimated Value</Text>
              <Text className="text-base font-bold text-[#0f6b4b]" style={{ fontFamily: 'serif' }}>
                {((parseFloat(editQuantity) || 0) * (parseFloat(editPrice) || 0)).toLocaleString()} LKR
              </Text>
            </View>

            <View className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl mb-5 flex-row items-start">
              <MaterialCommunityIcons name="information-outline" size={16} color="#d97706" className="mr-1.5 mt-0.5" />
              <Text className="text-[11px] text-amber-800 flex-1 leading-4">
                After saving, this listing will move directly to <Text className="font-bold">Pending</Text> awaiting administrator review.
              </Text>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl items-center justify-center border border-gray-200"
                disabled={savingEdit}
              >
                <Text className="text-gray-700 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                className="flex-1 bg-[#0f6b4b] py-3 rounded-xl items-center justify-center flex-row shadow-sm"
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={16} color="#fff" className="mr-1" />
                    <Text className="text-white font-bold text-sm" style={{ fontFamily: 'serif' }}>
                      Save & Submit
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Menu Modal (3-dots) */}
      <Modal
        visible={actionMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setActionMenuVisible(false)}
          className="flex-1 bg-black/50 justify-center items-center px-4"
        >
          <View 
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100"
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1} style={{ fontFamily: 'serif' }}>
              {actionMenuItem?.title || 'Manage Listing'}
            </Text>
            <Text className="text-xs text-gray-500 mb-4">Select an action for this listing</Text>

            <TouchableOpacity 
              onPress={() => {
                const item = actionMenuItem;
                setActionMenuVisible(false);
                if (item) handleOpenEdit(item);
              }}
              className="flex-row items-center py-3.5 px-3 bg-gray-50 rounded-xl mb-2.5 border border-gray-200"
              activeOpacity={0.7}
            >
              <View className="bg-[#eef6f1] p-2 rounded-lg mr-3">
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#0f6b4b" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900">Edit Quantity & Price</Text>
                <Text className="text-[11px] text-gray-500">Update terms and re-submit</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                const item = actionMenuItem;
                setActionMenuVisible(false);
                if (item) handleDeleteListing(item);
              }}
              className="flex-row items-center py-3.5 px-3 bg-red-50 rounded-xl mb-4 border border-red-200"
              activeOpacity={0.7}
            >
              <View className="bg-red-100 p-2 rounded-lg mr-3">
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-red-700">Delete Listing</Text>
                <Text className="text-[11px] text-red-500">Permanently delete this listing</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActionMenuVisible(false)}
              className="w-full py-3 bg-gray-100 rounded-xl items-center"
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setDeleteModalVisible(false);
            setItemToDelete(null);
          }
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 items-center">
            <View className="bg-red-100 p-3 rounded-full mb-3">
              <MaterialCommunityIcons name="trash-can-outline" size={32} color="#dc2626" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: 'serif' }}>
              Delete Listing?
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
              Are you sure you want to delete <Text className="font-semibold text-gray-900">"{itemToDelete?.title}"</Text>? This action cannot be undone.
            </Text>

            <View className="flex-row w-full gap-3">
              <TouchableOpacity 
                onPress={() => {
                  setDeleteModalVisible(false);
                  setItemToDelete(null);
                }}
                className="flex-1 bg-gray-100 py-3 rounded-xl items-center justify-center border border-gray-200"
                disabled={deleting}
                activeOpacity={0.7}
              >
                <Text className="text-gray-700 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmDeleteListing}
                disabled={deleting}
                className="flex-1 bg-red-600 py-3 rounded-xl items-center justify-center flex-row shadow-sm"
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#fff" className="mr-1.5" />
                    <Text className="text-white font-bold text-sm" style={{ fontFamily: 'serif' }}>
                      Delete
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
