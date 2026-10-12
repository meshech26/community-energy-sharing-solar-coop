import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { safeGoBack } from '../utils/navigationUtils';

export default function MessagesScreen({ navigation }) {
  const { user } = useAuthStore();
  const {
    conversations,
    loading,
    onlineUsers,
    initializeChat,
    fetchConversations,
    openConversation,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      initializeChat(user);
    }
  }, [user?.email]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const handleSelectConversation = (conversation) => {
    openConversation(conversation);
    navigation.navigate('Chat', {
      conversationId: conversation._id,
      recipient: conversation.recipient,
    });
  };

  // Format date helper: 10:42 AM, Yesterday, Monday, or DD/MM
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Filter conversations by recipient name
  const filteredConversations = conversations.filter((conv) => {
    const name = conv.recipient?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderConversationItem = ({ item }) => {
    const recipientName = item.recipient?.name || 'Community Member';
    const isOnline = onlineUsers.includes(item.recipient?._id?.toString());
    const unread = item.unreadCount || 0;
    const timeDisplay = formatTime(item.lastMessage?.createdAt || item.updatedAt);
    const preview = item.decryptedLastMessage || 'No messages yet';

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 bg-white"
        onPress={() => handleSelectConversation(item)}
      >
        {/* Avatar with Online Status Dot */}
        <View className="relative mr-3">
          <View className="w-12 h-12 rounded-full bg-[#e8f4ef] items-center justify-center border border-emerald-100">
            <MaterialCommunityIcons name="account" size={26} color="#0f6b4b" />
          </View>
          {isOnline && (
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          )}
        </View>

        {/* Conversation details */}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
              {recipientName}
            </Text>
            <Text className="text-xs text-gray-400 font-medium">{timeDisplay}</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text
              className={`text-sm flex-1 mr-2 ${
                unread > 0 ? 'font-bold text-gray-900' : 'text-gray-500'
              }`}
              numberOfLines={1}
            >
              {preview}
            </Text>

            {/* Unread Badge */}
            {unread > 0 && (
              <View className="bg-[#0f6b4b] rounded-full min-w-[20px] h-[20px] items-center justify-center px-1.5 ml-2">
                <Text className="text-white text-[11px] font-bold">
                  {unread > 9 ? '9+' : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => safeGoBack(navigation, 'MainTabs', { screen: 'Dashboard' })}
            className="p-1 -ml-1 mr-2 rounded-full active:bg-gray-100"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
            Messages
          </Text>
        </View>

        {/* ✏️ New Message action */}
        <TouchableOpacity
          onPress={() => navigation.navigate('NewMessage')}
          className="p-2 rounded-full bg-[#f0f7f4] active:bg-[#e2efe8]"
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#0f6b4b" />
        </TouchableOpacity>
      </View>

      {/* 🔍 Search conversations input */}
      <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" className="mr-2" />
          <TextInput
            className="flex-1 text-sm text-gray-900 py-0.5 ml-2"
            placeholder="Search conversations"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      {loading && conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f6b4b" />
          <Text className="text-gray-500 text-sm mt-3">Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversationItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f6b4b']} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 px-4">
              <View className="w-16 h-16 rounded-full bg-[#f2faf7] items-center justify-center mb-4">
                <MaterialCommunityIcons name="chat-outline" size={32} color="#0f6b4b" />
              </View>
              <Text className="text-lg font-bold text-gray-800 mb-1">
                {searchQuery ? 'No conversations match' : 'No messages yet'}
              </Text>
              <Text className="text-gray-500 text-center text-sm mb-6 max-w-xs">
                {searchQuery
                  ? 'Try searching with another name'
                  : 'Start a private 1-to-1 conversation with a solar co-op member.'}
              </Text>
              <TouchableOpacity
                className="bg-[#0f6b4b] px-5 py-2.5 rounded-full flex-row items-center"
                onPress={() => navigation.navigate('NewMessage')}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#fff" className="mr-2" />
                <Text className="text-white font-bold text-sm ml-1">New Message</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
