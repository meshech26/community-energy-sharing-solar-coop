import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { safeGoBack } from '../utils/navigationUtils';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, recipient } = route.params || {};
  const { user } = useAuthStore();
  const {
    activeConversation,
    messages,
    onlineUsers,
    typingMap,
    currentUser,
    sendMessage,
    sendTyping,
    openConversation,
    closeConversation,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);

  const resolvedRecipient = (activeConversation?._id === conversationId ? activeConversation.recipient : null) || recipient;
  const recipientId = (resolvedRecipient?._id || resolvedRecipient?.id)?.toString();
  const recipientEmail = resolvedRecipient?.email?.toLowerCase();
  const recipientName = resolvedRecipient?.name || 'Solar Member';
  const isOnline = onlineUsers.some(
    (id) =>
      id?.toString() === recipientId ||
      (recipientEmail && id?.toString()?.toLowerCase() === recipientEmail)
  );
  const typingParticipant = typingMap?.[conversationId];
  const ownIds = [currentUser?._id, currentUser?.id, user?._id, user?.id]
    .filter(Boolean).map(id => id.toString());
  const isTyping = Boolean(
    typingParticipant?.senderId &&
    typingParticipant.senderId === recipientId &&
    !ownIds.includes(typingParticipant.senderId)
  );
  const typingSenderName = typingParticipant?.senderName;

  useEffect(() => {
    // Ensure conversation is opened and messages decrypted with current user
    const userToUse = currentUser || user;
    openConversation({ _id: conversationId, recipient: resolvedRecipient }, userToUse);

    return () => {
      // Clear typing indicator on unmount
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTyping(false);
      closeConversation();
    };
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [messages.length, isTyping]);

  // Handle typing input with debounce
  const handleInputChange = (text) => {
    setInputText(text);

    if (text.trim().length > 0) {
      sendTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    } else {
      sendTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const messageToSend = inputText.trim();
    setInputText('');
    setSending(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(false);

    try {
      await sendMessage(messageToSend);
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  // Format message timestamp: 10:42 AM
  const formatMsgTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Current user identifiers
  const myId = (currentUser?._id || currentUser?.id || user?._id || user?.id)?.toString();

  const renderMessageItem = ({ item }) => {
    const senderIdStr = (item.senderId?._id || item.senderId)?.toString();

    // In a 1-to-1 chat:
    // If sender matches recipient, it is the OTHER person (receiver message -> LEFT side)
    // If sender does not match recipient (or matches myId), it is ME (sender message -> RIGHT side)
    const isMe = recipientId
      ? senderIdStr !== recipientId
      : senderIdStr === myId;

    return (
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: isMe ? 'flex-end' : 'flex-start',
          paddingHorizontal: 16,
          marginVertical: 4,
        }}
      >
        <View
          style={{
            maxWidth: '78%',
            backgroundColor: isMe ? '#0f6b4b' : '#f3f4f6',
            borderRadius: 18,
            borderTopRightRadius: isMe ? 4 : 18,
            borderTopLeftRadius: isMe ? 18 : 4,
            paddingHorizontal: 15,
            paddingVertical: 9,
            borderWidth: isMe ? 0 : 1,
            borderColor: isMe ? 'transparent' : '#e5e7eb',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          {/* Message Content */}
          <Text
            style={{
              fontSize: 15,
              lineHeight: 21,
              color: isMe ? '#ffffff' : '#111827',
              fontWeight: isMe ? '400' : '400',
            }}
          >
            {item.decryptedText || '🔐 [Encrypted Message]'}
          </Text>

          {/* Timestamp and Delivery indicator */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: isMe ? 'flex-end' : 'flex-start',
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: isMe ? 'rgba(255,255,255,0.75)' : '#9ca3af',
                fontWeight: '500',
              }}
            >
              {formatMsgTime(item.createdAt)}
            </Text>
            {isMe && (
              <View style={{ marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                {(() => {
                  const status = item.status || (item.read ? 'seen' : 'sent');
                  if (status === 'sending') {
                    return (
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={11}
                        color="rgba(255, 255, 255, 0.65)"
                      />
                    );
                  }
                  if (status === 'delivered') {
                    return (
                      <MaterialCommunityIcons
                        name="check-all"
                        size={14}
                        color="rgba(255, 255, 255, 0.85)"
                      />
                    );
                  }
                  if (status === 'seen') {
                    return (
                      <MaterialCommunityIcons
                        name="check-all"
                        size={14}
                        color="#38bdf8"
                      />
                    );
                  }
                  // 'sent' (recipient offline) -> single tick
                  return (
                    <MaterialCommunityIcons
                      name="check"
                      size={13}
                      color="rgba(255, 255, 255, 0.75)"
                    />
                  );
                })()}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-3 border-b border-gray-200 bg-white">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => safeGoBack(navigation, 'Messages')}
            className="p-1 -ml-1 mr-2 rounded-full active:bg-gray-100"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>

          {/* Recipient Avatar */}
          <View className="w-10 h-10 rounded-full bg-[#e8f4ef] items-center justify-center mr-3 border border-emerald-100">
            <MaterialCommunityIcons name="account" size={22} color="#0f6b4b" />
          </View>

          {/* Name & Online Status */}
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
              {recipientName}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isOnline ? '#10b981' : '#d1d5db',
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 12, fontWeight: '600', color: isOnline ? '#059669' : '#9ca3af' }}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Co-op secure encryption badge */}
        <View className="bg-[#f0f7f4] px-2.5 py-1 rounded-full flex-row items-center border border-emerald-100">
          <MaterialCommunityIcons name="shield-key-outline" size={13} color="#0f6b4b" className="mr-1" />
          <Text className="text-[10px] font-bold text-[#0f6b4b]">E2EE</Text>
        </View>
      </View>

      {/* Messages List & Typing Indicator */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        className="flex-1 bg-white"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderMessageItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24 px-6">
              <View className="w-14 h-14 rounded-full bg-[#f2faf7] items-center justify-center mb-3">
                <MaterialCommunityIcons name="shield-lock-outline" size={28} color="#0f6b4b" />
              </View>
              <Text className="text-base font-bold text-gray-800 mb-1">End-to-End Encrypted</Text>
              <Text className="text-xs text-gray-500 text-center leading-4 max-w-xs">
                Messages between you and {recipientName} are encrypted locally. Only participants can read them. Messages automatically expire after 7 days.
              </Text>
            </View>
          }
        />

        {/* Real-time typing indicator */}
        {isTyping && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 6, flexDirection: 'row', justifyContent: 'flex-start' }}>
            <View
              style={{
                backgroundColor: '#f3f4f6',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                borderRadius: 16,
                borderTopLeftRadius: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="dots-horizontal" size={16} color="#6b7280" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: '#4b5563', fontStyle: 'italic', fontWeight: '500' }}>
                {typingSenderName || recipientName} is typing...
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Input Bar */}
        <View className="flex-row items-center px-3 py-2.5 border-t border-gray-200 bg-white">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2 mr-2">
            <TextInput
              className="flex-1 text-sm text-gray-900 py-0"
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
            />
          </View>

          {/* Send Button ➤ */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: inputText.trim() && !sending ? '#0f6b4b' : '#e5e7eb',
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={18}
                color={inputText.trim() ? '#ffffff' : '#9ca3af'}
                style={{ marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
