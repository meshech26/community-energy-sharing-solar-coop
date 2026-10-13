import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';
import axios from 'axios';
import ChatScreen from '../screens/ChatScreen';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { connectSocket, emitTyping, emitStopTyping } from '../services/chatSocket';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('../store/authStore', () => ({
  useAuthStore: Object.assign(jest.fn(), { getState: jest.fn(), setState: jest.fn() }),
}));
jest.mock('../utils/cryptoUtils', () => ({
  getUserKeyPair: () => ({ publicKey: 'public', secretKey: 'secret' }),
  decryptMessage: jest.fn(), encryptMessage: jest.fn(),
}));
jest.mock('../services/chatSocket', () => ({
  BACKEND_URL: 'http://localhost:5000', connectSocket: jest.fn(),
  emitTyping: jest.fn(), emitStopTyping: jest.fn(), emitMarkAsRead: jest.fn(),
}));

const member = { _id: 'member-db-id', id: 'user-001', name: 'Member', email: 'member@example.test' };
const admin = { _id: 'admin-db-id', id: 'admin-001', name: 'Admin', email: 'admin@example.test', isCoopAdmin: true };
let listeners;

beforeEach(() => {
  jest.clearAllMocks();
  useChatStore.setState(useChatStore.getInitialState(), true);
  listeners = {};
  connectSocket.mockReturnValue({
    off: jest.fn(), on: (event, handler) => { listeners[event] = handler; },
  });
  axios.put.mockResolvedValue({ data: { success: true } });
  axios.post.mockResolvedValue({ data: { success: true } });
});

async function openChat(currentUser, recipient) {
  useAuthStore.mockReturnValue({ user: currentUser });
  useAuthStore.getState.mockReturnValue({ user: currentUser });
  axios.get.mockImplementation(async url => ({ data: url.endsWith('/me')
    ? { success: true, user: currentUser }
    : { success: true, data: [] } }));
  await useChatStore.getState().initializeChat(currentUser);
  return render(<ChatScreen
    navigation={{ navigate: jest.fn() }}
    route={{ params: { conversationId: 'direct-chat', recipient } }}
  />);
}

test.each([[member, admin], [admin, member]])(
  'only shows the other participant typing when signed in as $name',
  async (currentUser, recipient) => {
    const screen = await openChat(currentUser, recipient);
    await fireEvent.changeText(screen.getByPlaceholderText('Type a message...'), 'Hello');
    expect(emitTyping).toHaveBeenCalledWith('direct-chat', currentUser._id, recipient._id, currentUser.name);
    expect(screen.queryByText(/is typing\.\.\./)).toBeNull();

    // Ignore echoes from this account, including its preset ID and email aliases.
    for (const senderId of [currentUser._id, currentUser.id, currentUser.email]) {
      await act(async () => listeners.user_typing({ conversationId: 'direct-chat', senderId, senderName: currentUser.name }));
      expect(screen.queryByText(/is typing\.\.\./)).toBeNull();
    }

    await act(async () => listeners.user_typing({ conversationId: 'another-chat', senderId: recipient._id, senderName: recipient.name }));
    expect(screen.queryByText(/is typing\.\.\./)).toBeNull();
    await act(async () => listeners.user_typing({ conversationId: 'direct-chat', senderId: 'unrelated-user', senderName: 'Unrelated' }));
    expect(screen.queryByText(/is typing\.\.\./)).toBeNull();

    await act(async () => listeners.user_typing({ conversationId: 'direct-chat', senderId: recipient._id, senderName: recipient.name }));
    expect(screen.getByText(`${recipient.name} is typing...`)).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText('Type a message...'), '');
    expect(emitStopTyping).toHaveBeenCalledWith('direct-chat', currentUser._id, recipient._id);
    await act(async () => listeners.user_stopped_typing({ conversationId: 'direct-chat', senderId: currentUser._id }));
    expect(screen.getByText(`${recipient.name} is typing...`)).toBeTruthy();

    await act(async () => listeners.user_stopped_typing({ conversationId: 'direct-chat', senderId: recipient._id }));
    expect(screen.queryByText(/is typing\.\.\./)).toBeNull();
  }
);

test('switching accounts clears typing state from the previous account', async () => {
  const screen = await openChat(member, admin);
  await act(async () => listeners.user_typing({ conversationId: 'direct-chat', senderId: admin._id, senderName: admin.name }));
  await screen.unmount();
  axios.get.mockResolvedValue({ data: { success: true, user: admin, data: [] } });
  await useChatStore.getState().initializeChat(admin);
  expect(useChatStore.getState().typingMap).toEqual({});
});
