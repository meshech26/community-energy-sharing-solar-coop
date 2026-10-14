import axios from 'axios';
import { Platform } from 'react-native';

jest.mock('axios', () => ({ create: jest.fn() }));
jest.mock('../store/authStore', () => ({ useAuthStore: { getState: () => ({ token: null }) } }));

const originalPlatform = Platform.OS;
const originalWindow = global.window;
const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const originalWebUrl = process.env.EXPO_PUBLIC_WEB_API_URL;

afterEach(() => {
  Platform.OS = originalPlatform;
  global.window = originalWindow;
  if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  if (originalWebUrl === undefined) delete process.env.EXPO_PUBLIC_WEB_API_URL;
  else process.env.EXPO_PUBLIC_WEB_API_URL = originalWebUrl;
});

test.each([
  ['web', 'localhost', 'http://172.20.10.3:5000/api', undefined, 'http://localhost:5000/api'],
  ['android', undefined, 'http://172.20.10.3:5000/api', undefined, 'http://172.20.10.3:5000/api'],
  ['web', 'localhost', 'https://api.example.test/api', undefined, 'https://api.example.test/api'],
  ['web', 'localhost', 'http://172.20.10.3:5000/api', 'https://custom.example.test/api/', 'https://custom.example.test/api'],
])('%s on %s uses the correct backend for %s', (platform, hostname, configured, override, expected) => {
  Platform.OS = platform;
  global.window = hostname ? { location: { hostname } } : undefined;
  process.env.EXPO_PUBLIC_API_URL = configured;
  if (override) process.env.EXPO_PUBLIC_WEB_API_URL = override;
  else delete process.env.EXPO_PUBLIC_WEB_API_URL;
  axios.create.mockReturnValue({ interceptors: { request: { use: jest.fn() } } });
  jest.isolateModules(() => {
    require('react-native').Platform.OS = platform;
    const { API_URL } = require('../services/api');
    expect(API_URL).toBe(expected);
  });
  expect(axios.create).toHaveBeenLastCalledWith(expect.objectContaining({ baseURL: expected, timeout: 15000 }));
});
