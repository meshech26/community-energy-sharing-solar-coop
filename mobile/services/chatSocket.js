import { io } from 'socket.io-client';
import { Platform } from 'react-native';

// In React Native Android emulator, localhost is 10.0.2.2; on web/iOS it's 127.0.0.1
export const BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://127.0.0.1:5000';

let socket = null;

export const connectSocket = (userId) => {
  if (socket && socket.connected) {
    if (userId) socket.emit('join', { userId });
    return socket;
  }

  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    if (userId) {
      socket.emit('join', { userId });
    }
  });

  socket.on('connect_error', (error) => {
    console.warn('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitSendMessage = (data, callback) => {
  if (socket && socket.connected) {
    socket.emit('send_message', data, callback);
  }
};

export const emitTyping = (conversationId, senderId, receiverId, senderName) => {
  if (socket && socket.connected) {
    socket.emit('typing', { conversationId, senderId, receiverId, senderName });
  }
};

export const emitStopTyping = (conversationId, senderId, receiverId) => {
  if (socket && socket.connected) {
    socket.emit('stop_typing', { conversationId, senderId, receiverId });
  }
};

export const emitMarkAsRead = (conversationId, userId) => {
  if (socket && socket.connected) {
    socket.emit('mark_as_read', { conversationId, userId });
  }
};
