import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const { unreadTotal, initializeChat } = useChatStore();
  const isCoopAdmin = Boolean(user?.isCoopAdmin);
  const userName = user?.name || (isCoopAdmin ? 'Co-op Admin' : 'Kavindi');
  const chatFloat = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) setReduceMotion(enabled);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useFocusEffect(useCallback(() => {
    if (reduceMotion) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(chatFloat, { toValue: -5, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
      Animated.timing(chatFloat, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
    ]));
    animation.start();
    return () => {
      animation.stop();
      chatFloat.setValue(0);
    };
  }, [chatFloat, reduceMotion]));

  useEffect(() => {
    if (user) {
      initializeChat(user);
    }
  }, [user?.email]);


  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-white px-4 pt-4">
        {/* Admin Approvals Banner - Only visible to Admin (isCoopAdmin: true) */}
        {isCoopAdmin && (
          <TouchableOpacity 
            className="bg-[#e2e8e4] p-4 rounded-xl flex-row items-center justify-between mb-6 border border-emerald-200"
            onPress={() => navigation.navigate('AdminApprovals')}
          >
            <View className="flex-row items-center flex-1">
              <MaterialCommunityIcons name="shield-check-outline" size={24} color="#0f6b4b" className="mr-3" />
              <View className="flex-1 ml-2">
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-800 text-sm">Admin Approvals</Text>
                  <View className="bg-[#0f6b4b] px-1.5 py-0.5 rounded ml-2">
                    <Text className="text-white text-[9px] font-bold">Only Admin</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-xs">You have 3 pending cooperative requests.</Text>
              </View>
            </View>
            <Text className="text-[#0f6b4b] font-bold text-sm ml-2">Review</Text>
          </TouchableOpacity>
        )}

        <Text className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'serif' }}>Hello, {userName}</Text>
        <Text className="text-gray-600 mb-2 text-sm">Here is your energy summary for today.</Text>
        <Text className="text-gray-500 mb-4 text-xs">Your Solar Share overview will appear here.</Text>

        {/* Current Status Card */}
        <View className="bg-[#f2faf7] rounded-2xl p-6 mb-6">
          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-gray-700 text-xs font-bold tracking-widest mb-2">CURRENT STATUS</Text>
              <View className="flex-row items-baseline mb-2">
                <Text className="text-5xl font-bold text-[#0f6b4b]" style={{ fontFamily: 'serif' }}>15</Text>
                <Text className="text-lg font-bold text-[#0f6b4b] ml-1">kW</Text>
              </View>
              <View className="bg-gray-200/50 self-start px-3 py-1.5 rounded-full">
                <Text className="text-xs text-gray-600 font-semibold">Surplus Energy Available</Text>
              </View>
            </View>
            <View className="bg-gray-100 rounded-full h-10 w-10 items-center justify-center">
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#0f6b4b" />
            </View>
          </View>
          
          <View className="h-[1px] bg-gray-200/60 my-4" />
          
          <View className="flex-row justify-between">
            <View>
              <Text className="text-gray-600 text-[10px] mb-1">Est. Value</Text>
              <Text className="font-bold text-gray-900 text-base" style={{ fontFamily: 'serif' }}>750</Text>
              <Text className="text-gray-500 text-[10px] font-bold">LKR</Text>
            </View>
            <View className="items-end">
              <Text className="text-gray-600 text-[10px] mb-1">Today's Generation</Text>
              <Text className="font-bold text-gray-900 text-sm">22 kWh</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          className="bg-[#0f6b4b] rounded-xl p-5 mb-4"
          onPress={() => navigation.navigate('SellEnergy')}
        >
          <MaterialCommunityIcons name="store" size={24} color="#fff" className="mb-2" />
          <Text className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'serif' }}>Sell Surplus Energy</Text>
          <Text className="text-white/80 text-xs">List your 15 kWh to the marketplace.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-white rounded-xl p-5 mb-8 border border-[#0f6b4b]"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Energy Sharing' })}
        >
          <MaterialCommunityIcons name="cart-outline" size={24} color="#0f6b4b" className="mb-2" />
          <Text className="text-[#0f6b4b] text-xl font-bold mb-1" style={{ fontFamily: 'serif' }}>Buy Energy</Text>
          <Text className="text-gray-500 text-xs">Browse the local cooperative marketplace.</Text>
        </TouchableOpacity>

        {/* Quick Links */}
        <Text className="text-gray-600 text-[10px] font-bold tracking-widest mb-3">QUICK LINKS</Text>
        <View className="flex-row justify-between mb-8">
          <TouchableOpacity 
            className="flex-1 bg-white border border-gray-300 px-2.5 py-2.5 rounded-full flex-row items-center justify-center mr-2"
            onPress={() => navigation.navigate('MyListings')}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={15} color="#333" className="mr-1.5" />
            <Text className="text-gray-800 text-xs font-semibold">Listings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-white border border-gray-300 px-2.5 py-2.5 rounded-full flex-row items-center justify-center mr-2"
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <MaterialCommunityIcons name="history" size={15} color="#333" className="mr-1.5" />
            <Text className="text-gray-800 text-xs font-semibold">History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-white border border-gray-300 px-2.5 py-2.5 rounded-full flex-row items-center justify-center"
            onPress={() => navigation.navigate('Messages')}
          >
            <MaterialCommunityIcons name="chat-outline" size={15} color="#0f6b4b" className="mr-1.5" />
            <Text className="text-gray-800 text-xs font-semibold">Messages</Text>
            {unreadTotal > 0 && (
              <View className="bg-[#0f6b4b] rounded-full w-4 h-4 items-center justify-center ml-1">
                <Text className="text-white text-[9px] font-bold">{unreadTotal > 9 ? '9+' : unreadTotal}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
            <Text className="text-[#0f6b4b] text-xs font-bold">View All</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl border border-gray-200 mb-8 overflow-hidden">
          <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <View className="bg-[#e2e8e4] p-2.5 rounded-full mr-3">
                <MaterialCommunityIcons name="tag-outline" size={20} color="#0f6b4b" />
              </View>
              <View>
                <Text className="font-bold text-gray-900 text-sm">Sold 5 kWh to Nimal</Text>
                <Text className="text-gray-500 text-[10px]">Today, 10:42 AM</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[#0f6b4b] font-bold text-sm">+250</Text>
              <Text className="text-gray-500 text-[10px] font-semibold">Completed LKR</Text>
            </View>
          </View>
          
          <View className="p-4 flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <View className="bg-gray-100 p-2.5 rounded-full mr-3">
                <MaterialCommunityIcons name="sync" size={20} color="#666" />
              </View>
              <View>
                <Text className="font-bold text-gray-900 text-sm">Listed 10 kWh on Market</Text>
                <Text className="text-gray-500 text-[10px]">Yesterday, 4:15 PM</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-gray-900 font-bold text-sm">Pending</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 96 }} />
      </ScrollView>
      <Animated.View style={{ position: 'absolute', right: 20, bottom: 24, zIndex: 10, transform: [{ translateY: chatFloat }] }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={unreadTotal > 0 ? `Open chat, ${unreadTotal} unread messages` : 'Open chat'}
          accessibilityHint="Opens your messages"
          onPress={() => navigation.navigate('Messages')}
          activeOpacity={0.8}
          style={{
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
          }}
        >
          <MaterialCommunityIcons name="chat" size={28} color="#2563eb" />
          {unreadTotal > 0 && (
            <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: '#2563eb', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unreadTotal > 9 ? '9+' : unreadTotal}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
