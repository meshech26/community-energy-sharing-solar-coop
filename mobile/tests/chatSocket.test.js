import { io } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '../services/chatSocket';

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

beforeEach(() => {
  disconnectSocket();
  jest.clearAllMocks();
  io.mockImplementation(() => ({
    connected: false, on: jest.fn(), emit: jest.fn(), disconnect: jest.fn(),
  }));
});

afterEach(() => disconnectSocket());

const connect = socket => socket.on.mock.calls.find(([event]) => event === 'connect')[1]();

test('changing accounts disconnects the old socket and joins only the new user room', () => {
  const memberSocket = connectSocket('member-id');
  connect(memberSocket);
  memberSocket.connected = true;
  const adminSocket = connectSocket('admin-id');
  expect(memberSocket.disconnect).toHaveBeenCalledTimes(1);
  expect(adminSocket).not.toBe(memberSocket);
  connect(adminSocket);
  expect(adminSocket.emit).toHaveBeenCalledWith('join', { userId: 'admin-id' });
  expect(memberSocket.emit).toHaveBeenCalledTimes(1);
  expect(getSocket()).toBe(adminSocket);
});

test('reuses a pending connection for the same account and rejoins on reconnect', () => {
  const socket = connectSocket('member-id');
  expect(connectSocket('member-id')).toBe(socket);
  expect(io).toHaveBeenCalledTimes(1);
  connect(socket);
  connect(socket);
  expect(socket.emit).toHaveBeenCalledTimes(2);
  expect(socket.emit).toHaveBeenLastCalledWith('join', { userId: 'member-id' });
});

test('a late callback from the old connection cannot join its user on the new socket', () => {
  const oldSocket = connectSocket('member-id');
  const newSocket = connectSocket('admin-id');
  connect(oldSocket);
  expect(newSocket.emit).not.toHaveBeenCalled();
});
