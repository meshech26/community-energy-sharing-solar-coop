import { create } from 'zustand';
import axios from 'axios';

export const PRESET_USERS = {
  normal: {
    id: 'user-001',
    name: 'Kavindi Perera',
    email: 'user@solarcoop.com',
    isCoopAdmin: false,
    roleTitle: 'Normal User',
    householdId: '#H-104',
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
    const preset = roleType === 'admin' ? PRESET_USERS.admin : PRESET_USERS.normal;
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
        roleTitle: isCoopAdmin ? 'Admin User' : 'Normal User',
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

// Automatically inject role and email into all outgoing axios requests
axios.interceptors.request.use(
  (config) => {
    const user = useAuthStore.getState().user;
    if (user) {
      config.headers = config.headers || {};
      config.headers['x-user-role'] = user.isCoopAdmin ? 'admin' : 'normal';
      config.headers['x-user-email'] = user.email || '';
    }
    return config;
  },
  (error) => Promise.reject(error)
);