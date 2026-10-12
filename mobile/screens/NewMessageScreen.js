import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '../services/chatSocket';
import { useChatStore } from '../store/chatStore';
import { safeGoBack } from '../utils/navigationUtils';

export default function NewMessageScreen({ navigation }) {
  const [people, setPeople] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState(null);

  const { openConversation, fetchConversations } = useChatStore();

  useEffect(() => {
    fetchPeople();
  }, [searchQuery]);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const url = searchQuery.trim()
        ? `${BACKEND_URL}/api/chat/users?search=${encodeURIComponent(searchQuery.trim())}`
        : `${BACKEND_URL}/api/chat/users`;
      const res = await axios.get(url);
      if (res.data && res.data.success) {
        setPeople(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error fetching people:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPerson = async (person) => {
    if (creatingId) return;
    setCreatingId(person._id);

    try {
      // Check if conversation exists or create new one
      const res = await axios.post(`${BACKEND_URL}/api/chat/conversations`, {
        recipientId: person._id,
      });

      if (res.data && res.data.success) {
        const conversation = res.data.data;
        // Make sure recipient has public key
        if (!conversation.recipient?.publicKey && person.publicKey) {
          conversation.recipient.publicKey = person.publicKey;
        }

        openConversation(conversation);
        fetchConversations(); // refresh conversations list in background

        navigation.replace('Chat', {
          conversationId: conversation._id,
          recipient: conversation.recipient,
        });
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
    } finally {
      setCreatingId(null);
    }
  };

  const renderPersonItem = ({ item }) => {
    const isProcessing = creatingId === item._id;

    return (
      <TouchableOpacity
        className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 bg-white active:bg-gray-50"
        onPress={() => handleSelectPerson(item)}
        disabled={isProcessing}
      >
        <View className="flex-row items-center flex-1 mr-3">
          {/* Avatar */}
          <View className="w-11 h-11 rounded-full bg-[#e8f4ef] items-center justify-center mr-3 border border-emerald-100">
            <MaterialCommunityIcons name="account" size={24} color="#0f6b4b" />
          </View>
          {/* ONLY the name is displayed - No household, role, admin, or email */}
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        {/* Right Arrow → */}
        {isProcessing ? (
          <ActivityIndicator size="small" color="#0f6b4b" />
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => safeGoBack(navigation, 'Messages')}
          className="p-1 -ml-1 mr-2 rounded-full active:bg-gray-100"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
          New Message
        </Text>
      </View>

      {/* 🔍 Search people */}
      <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" className="mr-2" />
          <TextInput
            className="flex-1 text-sm text-gray-900 py-0.5 ml-2"
            placeholder="Search people"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* People List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f6b4b" />
          <Text className="text-gray-500 text-sm mt-3">Searching members...</Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item._id}
          renderItem={renderPersonItem}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 px-4">
              <MaterialCommunityIcons name="account-search-outline" size={48} color="#cbd5e1" className="mb-3" />
              <Text className="text-base font-bold text-gray-700 mb-1">No people found</Text>
              <Text className="text-gray-500 text-center text-sm">
                Try searching with a different name.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
