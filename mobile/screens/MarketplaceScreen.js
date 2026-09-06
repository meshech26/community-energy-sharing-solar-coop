import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Callout } from '../MapWrapper';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getCurrentLocation, calculateDistance, addPrivacyOffset, formatDistance, DEFAULT_REGION } from '../utils/locationUtils';

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

  const [viewMode, setViewMode] = useState('map');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchLoc = async () => {
      const loc = await getCurrentLocation();
      if (mounted && loc) {
        setUserLocation(loc);
      }
    };
    fetchLoc();
    return () => { mounted = false; };
  }, []);

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
    { _id: '1', sellerId: { name: 'Household A' }, trusted: true, location: { latitude: 6.9271, longitude: 79.8612 }, distance: '1.2 km away', approvedQuantity: 8, approvedUnitPrice: 42, availableDate: 'Today, 2 PM - 6 PM' },
    { _id: '2', sellerId: { name: 'Green Villa' }, trusted: false, location: { latitude: 6.9350, longitude: 79.8500 }, distance: '3.5 km away', approvedQuantity: 15, approvedUnitPrice: 40, availableDate: 'Tomorrow, 10 AM - 4 PM' },
    { _id: '3', sellerId: { name: 'Sunshine Co-op' }, demand: 'High Demand', location: { latitude: 6.9200, longitude: 79.8700 }, distance: '0.8 km away', approvedQuantity: 4.5, approvedUnitPrice: 45, availableDate: 'Today, 1 PM - 3 PM' },
    { _id: '4', sellerId: { name: 'Eco Haven' }, trusted: true, location: { latitude: 6.9400, longitude: 79.8550 }, distance: '2.1 km away', approvedQuantity: 25, approvedUnitPrice: 44, availableDate: 'Today, 11 AM - 5 PM' },
    { _id: '5', sellerId: { name: 'Solar Crest' }, demand: 'High Demand', location: { latitude: 6.9150, longitude: 79.8650 }, distance: '1.8 km away', approvedQuantity: 30, approvedUnitPrice: 42, availableDate: 'Today, 12 PM - 6 PM' },
    { _id: '6', sellerId: { name: 'Highland Peak' }, trusted: false, location: { latitude: 6.9500, longitude: 79.8400 }, distance: '4.0 km away', approvedQuantity: 50, approvedUnitPrice: 52, availableDate: 'Tomorrow, 9 AM - 3 PM' },
  ];

  const rawListings = listings.length > 0 ? listings : mockListings;

  const minQ = parseFloat(minQuantity);
  const maxP = parseFloat(maxPrice);

  const displayListings = rawListings.filter((item) => {
    // Exclude current user's own listings from the buying section
    if (user) {
      const sellerObj = item.sellerId;
      const sellerIdStr = typeof sellerObj === 'object' ? (sellerObj?._id || sellerObj?.id) : sellerObj;
      const currentUserId = user.id || user._id;

      if (sellerIdStr && currentUserId && sellerIdStr.toString() === currentUserId.toString()) {
        return false;
      }
      if (sellerObj?.email && user.email && sellerObj.email.toLowerCase() === user.email.toLowerCase()) {
        return false;
      }
      if (sellerObj?.name && user.name && sellerObj.name.trim().toLowerCase() === user.name.trim().toLowerCase()) {
        return false;
      }
    }

    const qty = Number(item.availableQuantity !== undefined ? item.availableQuantity : (item.approvedQuantity > 0 ? item.approvedQuantity : item.pendingQuantity || item.quantity || 0));
    const price = Number(item.approvedUnitPrice > 0 ? item.approvedUnitPrice : item.pendingUnitPrice || item.unitPrice || 0);

    if (!isNaN(minQ) && qty < minQ) {
      return false;
    }
    if (!isNaN(maxP) && price > maxP) {
      return false;
    }
    return true;
  });

  const markersData = useMemo(() => {
    return displayListings.map(item => {
      if (!item.location) return null;
      const offsetLoc = addPrivacyOffset(item.location.latitude, item.location.longitude);
      return {
        ...item,
        displayLocation: offsetLoc
      };
    }).filter(Boolean);
  }, [displayListings]);

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
        <Text className="text-gray-600 mb-4 text-xs">Browse local households selling surplus solar energy.</Text>

        {/* Toggle Bar */}
        <View className="flex-row items-center bg-gray-200 rounded-xl p-1 mb-5">
          <TouchableOpacity
            className={`flex-1 flex-row justify-center items-center py-2 rounded-lg ${viewMode === 'map' ? 'bg-[#0f6b4b]' : 'bg-transparent'}`}
            onPress={() => setViewMode('map')}
          >
            <MaterialCommunityIcons name="map-outline" size={16} color={viewMode === 'map' ? '#fff' : '#4b5563'} />
            <Text className={`ml-2 text-xs font-bold ${viewMode === 'map' ? 'text-white' : 'text-gray-600'}`}>Map View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 flex-row justify-center items-center py-2 rounded-lg ${viewMode === 'list' ? 'bg-[#0f6b4b]' : 'bg-transparent'}`}
            onPress={() => setViewMode('list')}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={16} color={viewMode === 'list' ? '#fff' : '#4b5563'} />
            <Text className={`ml-2 text-xs font-bold ${viewMode === 'list' ? 'text-white' : 'text-gray-600'}`}>List View</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'map' ? (
          <View>
            <View className="w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/7] rounded-2xl overflow-hidden mb-4 border border-gray-200">
              <MapView
                ref={mapRef}
                style={{ width: '100%', height: '100%' }}
                initialRegion={userLocation ? { 
                  latitude: userLocation.latitude, 
                  longitude: userLocation.longitude, 
                  latitudeDelta: 0.05, 
                  longitudeDelta: 0.05 
                } : DEFAULT_REGION}
                showsUserLocation={true}
              >
                {markersData.map((marker, index) => (
                  <Marker
                    key={marker._id || index}
                    coordinate={marker.displayLocation}
                    pinColor='#0f6b4b'
                    onPress={() => setSelectedListing(marker)}
                  />
                ))}
              </MapView>
            </View>

            {selectedListing && (
              <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm relative">
                <TouchableOpacity 
                  className="absolute top-3 right-3 z-10 bg-gray-100 p-1 rounded-full"
                  onPress={() => setSelectedListing(null)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#666" />
                </TouchableOpacity>

                {(() => {
                  const quantity = selectedListing.availableQuantity !== undefined ? selectedListing.availableQuantity : (selectedListing.approvedQuantity > 0 ? selectedListing.approvedQuantity : selectedListing.pendingQuantity);
                  const price = selectedListing.approvedUnitPrice > 0 ? selectedListing.approvedUnitPrice : selectedListing.pendingUnitPrice;
                  let sellerName = selectedListing.sellerId?.name || 'Community Member';
                  if (sellerName === 'Regular User') sellerName = 'Kavindi Perera';
                  const distanceStr = userLocation && selectedListing.location ? formatDistance(calculateDistance(userLocation.latitude, userLocation.longitude, selectedListing.location.latitude, selectedListing.location.longitude)) : (selectedListing.distance || '1.5 km away');

                  return (
                    <>
                      <Text className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'serif' }}>{sellerName}</Text>
                      <View className="flex-row items-center mb-3">
                        <MaterialCommunityIcons name="map-marker-outline" size={12} color="#666" />
                        <Text className="text-[10px] text-gray-500 ml-1">{distanceStr}</Text>
                      </View>

                      <View className="flex-row justify-between items-center mb-4">
                        <View>
                          <Text className="text-[9px] text-gray-600 mb-1">Energy</Text>
                          <Text className="text-base font-bold text-[#0f6b4b]">{quantity} kWh</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-[9px] text-gray-600 mb-1">Price</Text>
                          <Text className="text-base font-bold text-gray-900">LKR {price}<Text className="text-[10px] text-gray-500 font-normal">/kWh</Text></Text>
                        </View>
                      </View>

                      <View className="flex-row space-x-2">
                        <TouchableOpacity 
                          className="flex-1 border border-[#0f6b4b] rounded-lg py-2 items-center mr-1"
                          onPress={() => navigation.navigate('ListingDetails', { listing: selectedListing })}
                        >
                          <Text className="text-[#0f6b4b] text-xs font-bold">View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          className="flex-1 bg-[#0f6b4b] rounded-lg py-2 items-center flex-row justify-center ml-1"
                          onPress={() => navigation.navigate('ListingDetails', { listing: selectedListing })}
                        >
                          <Text className="text-white text-xs font-bold mr-1">Buy Energy</Text>
                          <MaterialCommunityIcons name="arrow-right" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                })()}
              </View>
            )}

            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Available near you</Text>
              <Text className="text-xs text-gray-500">{markersData.length} listings</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4 px-4 py-2">
              {markersData.map((item, index) => {
                const quantity = item.availableQuantity !== undefined ? item.availableQuantity : (item.approvedQuantity > 0 ? item.approvedQuantity : item.pendingQuantity);
                const price = item.approvedUnitPrice > 0 ? item.approvedUnitPrice : item.pendingUnitPrice;
                let sellerName = item.sellerId?.name || 'Community Member';
                if (sellerName === 'Regular User') sellerName = 'Kavindi Perera';
                const distanceStr = userLocation && item.location ? formatDistance(calculateDistance(userLocation.latitude, userLocation.longitude, item.location.latitude, item.location.longitude)) : (item.distance || '1.5 km away');

                return (
                  <TouchableOpacity
                    key={item._id || index}
                    className={`bg-white rounded-xl p-3 mr-3 border ${selectedListing && selectedListing._id === item._id ? 'border-[#0f6b4b]' : 'border-gray-200'} shadow-sm w-48`}
                    onPress={() => navigation.navigate('ListingDetails', { listing: item })}
                  >
                    <Text className="text-sm font-bold text-gray-900 mb-1" numberOfLines={1} style={{ fontFamily: 'serif' }}>{sellerName}</Text>
                    <View className="flex-row items-center mb-2">
                      <MaterialCommunityIcons name="map-marker-outline" size={10} color="#666" />
                      <Text className="text-[10px] text-gray-500 ml-1">{distanceStr}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm font-bold text-[#0f6b4b]">{quantity} kWh</Text>
                      <Text className="text-xs font-bold text-gray-900">LKR {price}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {markersData.length === 0 && (
                <View className="w-64 p-4 border border-gray-200 rounded-xl bg-white items-center justify-center">
                  <Text className="text-xs text-gray-500">No listings with location data</Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          <View>
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
                <MaterialCommunityIcons 
                  name={hasActiveFilters ? "filter-remove-outline" : "solar-power"} 
                  size={44} 
                  color={hasActiveFilters ? "#9ca3af" : "#0f6b4b"} 
                  className="mb-3" 
                />
                <Text className="text-base font-bold text-gray-800 mb-1" style={{ fontFamily: 'serif' }}>
                  {hasActiveFilters ? 'No Matching Listings' : 'No Listings from Other Members'}
                </Text>
                <Text className="text-xs text-gray-500 text-center mb-4 leading-5 px-2">
                  {hasActiveFilters 
                    ? `No energy offers match Min: ${minQuantity || '0'} kWh and Max: LKR ${maxPrice || '∞'}/kWh.`
                    : 'There are currently no energy listings from other community members. Energy you post will appear here for other members to purchase.'}
                </Text>
                {hasActiveFilters ? (
                  <TouchableOpacity 
                    onPress={() => { setMinQuantity(''); setMaxPrice(''); }}
                    className="bg-[#0f6b4b] px-4 py-2.5 rounded-lg"
                  >
                    <Text className="text-white text-xs font-bold">Clear Filters</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('MyListings')}
                    className="bg-[#0f6b4b] px-4 py-2.5 rounded-lg flex-row items-center"
                  >
                    <MaterialCommunityIcons name="format-list-bulleted" size={14} color="#fff" className="mr-1.5" />
                    <Text className="text-white text-xs font-bold">View My Listings</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              displayListings.map((item, index) => {
                const quantity = item.availableQuantity !== undefined ? item.availableQuantity : (item.approvedQuantity > 0 ? item.approvedQuantity : item.pendingQuantity);
                const price = item.approvedUnitPrice > 0 ? item.approvedUnitPrice : item.pendingUnitPrice;
                let sellerName = item.sellerId?.name || 'Community Member';
                if (sellerName === 'Regular User') {
                  sellerName = 'Kavindi Perera';
                }
                const dateStr = item.availableDate || 'N/A';
                const distanceStr = userLocation && item.location ? formatDistance(calculateDistance(userLocation.latitude, userLocation.longitude, item.location.latitude, item.location.longitude)) : (item.distance || '1.5 km away');
                
                return (
                  <View key={item._id || index.toString()} className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <Text className="text-lg font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{sellerName}</Text>
                        <View className="flex-row items-center mt-1">
                          <MaterialCommunityIcons name="map-marker-outline" size={12} color="#666" />
                          <Text className="text-[10px] text-gray-500 ml-1">{distanceStr}</Text>
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
          </View>
        )}
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
