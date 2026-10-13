import { create } from 'zustand';
import axios from 'axios';
import {
  BACKEND_URL,
  connectSocket,
  getSocket,
  emitSendMessage,
  emitTyping,
  emitStopTyping,
  emitMarkAsRead,
} from '../services/chatSocket';
import { getUserKeyPair, encryptMessage, decryptMessage } from '../utils/cryptoUtils';
import { useAuthStore } from './authStore';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  unreadTotal: 0,
  onlineUsers: [],
  typingMap: {}, // { [conversationId]: { senderId, senderName } }
  loading: false,
  currentUser: null,
  initializedUserId: null,
  isInitializing: false,

  // Initialize socket and load chat data for the logged-in user
  initializeChat: async (user) => {
    if (!user) return;
    const userKey = user.email || user.id || user._id;

    // Prevent redundant re-initialization for the same user
    if (get().initializedUserId === userKey && get().currentUser?._id) {
      return;
    }
    if (get().isInitializing) return;
    set({ isInitializing: true });

    // Set initial user
    set({ currentUser: user, typingMap: {} });

    // Fetch real profile from backend to ensure we have actual MongoDB _id
    let realUser = user;
    try {
      const meRes = await axios.get(`${BACKEND_URL}/api/chat/me`);
      if (meRes.data && meRes.data.success && meRes.data.user) {
        realUser = { ...user, ...meRes.data.user };
        set({ currentUser: realUser });
        if (!user._id) {
          useAuthStore.setState((state) => ({
            user: { ...state.user, ...meRes.data.user },
          }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch MongoDB user profile:', e.message);
    }

    set({ initializedUserId: userKey, isInitializing: false });

    const keyPair = getUserKeyPair(realUser.email || realUser.id);

    // Sync public key to backend
    try {
      await axios.put(`${BACKEND_URL}/api/chat/public-key`, {
        publicKey: keyPair.publicKey,
      });
    } catch (e) {
      console.warn('Could not sync public key:', e.message);
    }

    // Connect socket using MongoDB _id or user ID
    const socketUserId = realUser._id || realUser.id;
    const socket = connectSocket(socketUserId);

    // Register socket listeners (remove existing to prevent duplicates)
    socket.off('new_message');
    socket.off('unread_updated');
    socket.off('user_typing');
    socket.off('user_stopped_typing');
    socket.off('user_online');
    socket.off('user_offline');
    socket.off('online_users');

    socket.on('online_users', ({ userIds }) => {
      set({ onlineUsers: userIds || [] });
    });

    socket.on('user_online', ({ userId, rawUserId }) => {
      const current = get().onlineUsers;
      const toAdd = [userId, rawUserId].filter(Boolean);
      set({ onlineUsers: Array.from(new Set([...current, ...toAdd])) });
    });

    socket.on('user_offline', ({ userId }) => {
      set({ onlineUsers: get().onlineUsers.filter((id) => id !== userId) });
    });

    socket.on('user_typing', ({ conversationId, senderId, senderName }) => {
      const { currentUser } = get();
      const ownIds = [currentUser?._id, currentUser?.id, currentUser?.email]
        .filter(Boolean).map(id => id.toString());
      const typingUserId = senderId?.toString();
      if (!conversationId || !typingUserId || ownIds.includes(typingUserId)) return;
      set((state) => ({
        typingMap: { ...state.typingMap, [conversationId]: { senderId: typingUserId, senderName } },
      }));
    });

    socket.off('messages_delivered');
    socket.off('messages_seen');

    socket.on('messages_delivered', ({ receiverId }) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.status === 'sent' || m.status === 'sending') {
            return { ...m, status: 'delivered' };
          }
          return m;
        }),
      }));
    });

    socket.on('messages_seen', ({ conversationId, seenBy, seenAt }) => {
      const { activeConversation, currentUser } = get();
      if (activeConversation && activeConversation._id?.toString() === conversationId?.toString()) {
        const myId = (currentUser?._id || currentUser?.id)?.toString();
        set((state) => ({
          messages: state.messages.map((m) => {
            const mSenderId = (m.senderId?._id || m.senderId)?.toString();
            // If message was sent by me or is currently unread, mark as seen
            if (mSenderId === myId || m.status !== 'seen') {
              return {
                ...m,
                status: 'seen',
                read: true,
                seenAt: seenAt || new Date().toISOString(),
              };
            }
            return m;
          }),
        }));
      }
    });

    socket.on('user_stopped_typing', ({ conversationId, senderId }) => {
      set((state) => {
        // An echoed stop event from me must not hide the other person's indicator.
        if (!senderId || state.typingMap[conversationId]?.senderId !== senderId.toString()) return state;
        const next = { ...state.typingMap };
        delete next[conversationId];
        return { typingMap: next };
      });
    });

    socket.on('new_message', ({ message, conversationId }) => {
      const { activeConversation, currentUser, conversations } = get();
      const myKeyPair = getUserKeyPair(currentUser?.email || currentUser?.id);

      // If this conversation is currently open on screen
      if (activeConversation && activeConversation._id === conversationId) {
        const otherPubKey = activeConversation.recipient?.publicKey;
        const decryptedText = decryptMessage(
          message.ciphertext,
          message.nonce,
          otherPubKey,
          myKeyPair.secretKey
        );

        const decryptedMsg = { ...message, decryptedText };

        set((state) => {
          // Remove any temporary optimistic message with same ciphertext
          const filtered = state.messages.filter(
            (m) => !(m._id?.startsWith?.('temp-') && m.ciphertext === message.ciphertext) && m._id !== message._id
          );
          return { messages: [...filtered, decryptedMsg] };
        });

        // Mark as read immediately if viewer is receiver
        const myId = (currentUser?._id || currentUser?.id)?.toString();
        const msgSenderId = (message.senderId?._id || message.senderId)?.toString();
        if (msgSenderId !== myId) {
          emitMarkAsRead(conversationId, myId);
          axios.post(`${BACKEND_URL}/api/chat/messages/read/${conversationId}`).catch(() => {});
        }
      }

      // Update conversations list preview
      const targetConv = conversations.find((c) => c._id === conversationId);
      const otherPubKey = targetConv?.recipient?.publicKey || activeConversation?.recipient?.publicKey;
      const previewText = decryptMessage(
        message.ciphertext,
        message.nonce,
        otherPubKey,
        myKeyPair.secretKey
      );

      set((state) => {
        const updatedConversations = state.conversations.map((conv) => {
          if (conv._id === conversationId) {
            const isViewing = activeConversation && activeConversation._id === conversationId;
            const myId = (currentUser?._id || currentUser?.id)?.toString();
            const msgSenderId = (message.senderId?._id || message.senderId)?.toString();
            const isIncoming = msgSenderId !== myId;
            const newUnread = isViewing ? 0 : isIncoming ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0;

            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                ciphertext: message.ciphertext,
                nonce: message.nonce,
                senderId: message.senderId,
                createdAt: message.createdAt,
              },
              decryptedLastMessage: previewText,
              unreadCount: newUnread,
              updatedAt: message.createdAt,
            };
          }
          return conv;
        });

        updatedConversations.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        const newUnreadTotal = updatedConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

        return {
          conversations: updatedConversations,
          unreadTotal: newUnreadTotal,
        };
      });
    });

    socket.on('unread_updated', () => {
      get().fetchUnreadCount();
      get().fetchConversations();
    });

    // Fetch conversations and unread count
    await get().fetchConversations();
    await get().fetchUnreadCount();
  },

  // Fetch all conversations for the user
  fetchConversations: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BACKEND_URL}/api/chat/conversations`);
      if (response.data && response.data.success) {
        const rawConvs = response.data.data || [];
        const { currentUser } = get();
        const myKeyPair = getUserKeyPair(currentUser?.email || currentUser?.id);

        // Decrypt last messages
        const decryptedConvs = rawConvs.map((conv) => {
          let preview = '';
          if (conv.lastMessage && conv.lastMessage.ciphertext && conv.lastMessage.nonce) {
            preview = decryptMessage(
              conv.lastMessage.ciphertext,
              conv.lastMessage.nonce,
              conv.recipient?.publicKey,
              myKeyPair.secretKey
            );
          }
          return {
            ...conv,
            decryptedLastMessage: preview,
          };
        });

        const totalUnread = decryptedConvs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

        set({
          conversations: decryptedConvs,
          unreadTotal: totalUnread,
          loading: false,
        });
      }
    } catch (error) {
      console.warn('Error fetching conversations:', error.message);
      set({ loading: false });
    }
  },

  // Fetch total unread count for Dashboard header badge
  fetchUnreadCount: async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/chat/unread-count`);
      if (response.data && response.data.success) {
        set({ unreadTotal: response.data.totalUnread || 0 });
      }
    } catch (e) {
      console.warn('Error fetching unread count:', e.message);
    }
  },

  // Open a conversation and fetch its messages
  // Open a conversation and fetch its messages
  openConversation: async (conversation, optUser) => {
    // 1. Resolve current user from state, params, or authStore
    const userToUse = optUser || get().currentUser || useAuthStore.getState().user || { email: 'user@solarcoop.com' };
    const myKeyPair = getUserKeyPair(userToUse?.email || userToUse?.id);
    const myIdStr = (userToUse?._id || userToUse?.id)?.toString();

    set({ activeConversation: conversation, messages: [] });

    // Mark as read in DB and via socket
    const convId = conversation._id;
    const userId = myIdStr;

    emitMarkAsRead(convId, userId);
    axios.post(`${BACKEND_URL}/api/chat/messages/read/${convId}`).catch(() => {});

    // Update unread count locally
    set((state) => {
      const updatedConvs = state.conversations.map((c) =>
        c._id === convId ? { ...c, unreadCount: 0 } : c
      );
      const newTotal = updatedConvs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return {
        conversations: updatedConvs,
        unreadTotal: newTotal,
      };
    });

    // Fetch messages
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chat/messages/${convId}`);
      if (res.data && res.data.success) {
        const rawMessages = res.data.data || [];
        const serverRecipient = res.data.conversation?.recipient;
        const recipient = serverRecipient || conversation.recipient;

        if (serverRecipient) {
          set({ activeConversation: { ...conversation, recipient } });
        }

        const fallbackOtherPubKey = recipient?.publicKey || (recipient?.email ? getUserKeyPair(recipient.email).publicKey : null);

        const decryptedMessages = rawMessages.map((m) => {
          // In 1-to-1 Curve25519 E2EE, both incoming and outgoing messages in this chat
          // are decrypted using the OTHER participant's public key + my secret key.
          let otherPubKey = fallbackOtherPubKey;

          // If fallbackOtherPubKey is missing or equals my own public key, find the other participant's key
          if (!otherPubKey || otherPubKey === myKeyPair.publicKey) {
            const senderPubKey = typeof m.senderId === 'object' ? m.senderId?.publicKey : null;
            const receiverPubKey = typeof m.receiverId === 'object' ? m.receiverId?.publicKey : null;

            if (senderPubKey && senderPubKey !== myKeyPair.publicKey) {
              otherPubKey = senderPubKey;
            } else if (receiverPubKey && receiverPubKey !== myKeyPair.publicKey) {
              otherPubKey = receiverPubKey;
            }
          }

          if (!otherPubKey && recipient?.email) {
            otherPubKey = getUserKeyPair(recipient.email).publicKey;
          }

          const decryptedText = decryptMessage(
            m.ciphertext,
            m.nonce,
            otherPubKey,
            myKeyPair.secretKey
          );

          return {
            ...m,
            decryptedText,
          };
        });

        set({ messages: decryptedMessages });
      }
    } catch (err) {
      console.warn('Error fetching messages for conversation:', err.message);
    }
  },

  // Close active conversation
  closeConversation: () => {
    set({ activeConversation: null, messages: [] });
  },

  // Send an encrypted message
  sendMessage: async (text) => {
    const { activeConversation, currentUser } = get();
    if (!activeConversation || !text || !text.trim() || !currentUser) return;

    const trimmedText = text.trim();
    const myKeyPair = getUserKeyPair(currentUser.email || currentUser.id);
    const recipientPubKey = activeConversation.recipient?.publicKey;

    if (!recipientPubKey) {
      console.error('Recipient public key not available');
      return;
    }

    try {
      // 1. Encrypt locally (E2EE)
      const { ciphertext, nonce } = encryptMessage(
        trimmedText,
        recipientPubKey,
        myKeyPair.secretKey
      );

      const senderId = (currentUser._id || currentUser.id)?.toString();
      const receiverId = (activeConversation.recipient._id || activeConversation.recipient.id)?.toString();
      const convId = activeConversation._id;

      // 2. Optimistic UI update: status is 'sending' (clock icon)
      const tempId = 'temp-' + Date.now();
      const optimisticMsg = {
        _id: tempId,
        conversationId: convId,
        senderId,
        receiverId,
        ciphertext,
        nonce,
        decryptedText: trimmedText,
        status: 'sending',
        read: false,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, optimisticMsg],
      }));

      // Update conversations list preview immediately
      set((state) => {
        const updated = state.conversations.map((c) => {
          if (c._id === convId) {
            return {
              ...c,
              lastMessage: { ciphertext, nonce, senderId, createdAt: optimisticMsg.createdAt },
              decryptedLastMessage: trimmedText,
              updatedAt: optimisticMsg.createdAt,
            };
          }
          return c;
        });
        updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        return { conversations: updated };
      });

      // 3. Send via Socket.IO
      let sentViaSocket = false;
      emitSendMessage(
        {
          conversationId: convId,
          senderId,
          receiverId,
          ciphertext,
          nonce,
        },
        (response) => {
          if (response && response.success) {
            sentViaSocket = true;
            const confirmedMsg = {
              ...response.data,
              status: response.data.status || 'sent',
              decryptedText: trimmedText,
            };
            set((state) => ({
              messages: state.messages.map((m) => (m._id === tempId ? confirmedMsg : m)),
            }));
          }
        }
      );

      // 4. REST API fallback if socket does not confirm within 1.5s
      setTimeout(async () => {
        if (!sentViaSocket) {
          try {
            const restRes = await axios.post(`${BACKEND_URL}/api/chat/messages`, {
              conversationId: convId,
              receiverId,
              ciphertext,
              nonce,
            });
            if (restRes.data && restRes.data.success) {
              const confirmedMsg = {
                ...restRes.data.data,
                status: restRes.data.data.status || 'sent',
                decryptedText: trimmedText,
              };
              set((state) => ({
                messages: state.messages.map((m) => (m._id === tempId ? confirmedMsg : m)),
              }));
            }
          } catch (e) {
            console.warn('REST fallback error:', e.message);
          }
        }
      }, 1500);

      // Stop typing
      get().sendTyping(false);
    } catch (err) {
      console.error('Failed to send encrypted message:', err);
    }
  },

  // Typing event
  sendTyping: (isTyping) => {
    const { activeConversation, currentUser } = get();
    if (!activeConversation || !currentUser) return;

    const senderId = (currentUser._id || currentUser.id)?.toString();
    const receiverId = (activeConversation.recipient?._id || activeConversation.recipient?.id)?.toString();
    const senderName = currentUser.name || 'Co-op Member';
    if (!senderId || !receiverId || senderId === receiverId) return;

    if (isTyping) {
      emitTyping(activeConversation._id, senderId, receiverId, senderName);
    } else {
      emitStopTyping(activeConversation._id, senderId, receiverId);
    }
  },
}));
