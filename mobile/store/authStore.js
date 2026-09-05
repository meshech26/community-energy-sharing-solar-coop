import { create } from 'zustand';
import axios from 'axios';

export const PRESET_USERS = {
  normal: {
    id: 'user-001',
    name: 'Kavindi Perera',
    email: 'user@solarcoop.com',
    isCoopAdmin: false,
    roleTitle: 'Co-op Member',
    householdId: '#H-104',
  },
  member2: {
    id: 'user-002',
    name: 'Sunil Fernando',
    email: 'sunil@solarcoop.com',
    isCoopAdmin: false,
    roleTitle: 'Co-op Member',
    householdId: '#H-105',
  },
  admin: {
    id: 'admin-001',
    name: 'Co-op Admin',
    email: 'admin@solarcoop.com',
    isCoopAdmin: true,
    roleTitle: 'Admin User',
    householdId: '#H-001',
  },
};

export const useAuthStore = create((set, get) => ({
  user: { ...PRESET_USERS.normal },
  token: 'temp-jwt-token-normal',
  isAuthenticated: false,

  login: (user, token = 'temp-jwt-token') =>
    set({
      user,
      token,
      isAuthenticated: true,
    }),

  loginWithRole: (roleType = 'normal') => {
    const preset = PRESET_USERS[roleType] || PRESET_USERS.normal;
    set({
      user: { ...preset },
      token: `temp-token-${roleType}`,
      isAuthenticated: true,
    });
    return preset;
  },

  setRole: (isCoopAdmin) => {
    const currentUser = get().user;
    if (!currentUser) {
      const preset = isCoopAdmin ? PRESET_USERS.admin : PRESET_USERS.normal;
      set({ user: { ...preset }, isAuthenticated: true });
      return;
    }

    set({
      user: {
        ...currentUser,
        isCoopAdmin: Boolean(isCoopAdmin),
        roleTitle: isCoopAdmin ? 'Admin User' : 'Co-op Member',
      },
    });
  },

  toggleRole: () => {
    const currentUser = get().user;
    const currentIsAdmin = currentUser ? currentUser.isCoopAdmin : false;
    get().setRole(!currentIsAdmin);
  },

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),
}));

// Automatically inject role, email, and name into all outgoing axios requests
axios.interceptors.request.use(
  (config) => {
    const user = useAuthStore.getState().user;
    if (user) {
      config.headers = config.headers || {};
      config.headers['x-user-role'] = user.isCoopAdmin ? 'admin' : 'normal';
      config.headers['x-user-email'] = user.email || '';
      config.headers['x-user-name'] = user.name || '';
    }
    return config;
  },
  (error) => Promise.reject(error)
);