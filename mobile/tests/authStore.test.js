import { useAuthStore, PRESET_USERS } from '../store/authStore';

describe('Role-Based Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  test('default user can be logged in as normal user with isCoopAdmin: false', () => {
    const user = useAuthStore.getState().loginWithRole('normal');

    expect(user.isCoopAdmin).toBe(false);
    expect(user.email).toBe(PRESET_USERS.normal.email);
    expect(useAuthStore.getState().user.isCoopAdmin).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test('can login as admin user with isCoopAdmin: true', () => {
    const admin = useAuthStore.getState().loginWithRole('admin');

    expect(admin.isCoopAdmin).toBe(true);
    expect(admin.email).toBe(PRESET_USERS.admin.email);
    expect(useAuthStore.getState().user.isCoopAdmin).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test('toggleRole switches between normal and admin user', () => {
    useAuthStore.getState().loginWithRole('normal');
    expect(useAuthStore.getState().user.isCoopAdmin).toBe(false);

    useAuthStore.getState().toggleRole();
    expect(useAuthStore.getState().user.isCoopAdmin).toBe(true);

    useAuthStore.getState().toggleRole();
    expect(useAuthStore.getState().user.isCoopAdmin).toBe(false);
  });

  test('setRole explicitly updates isCoopAdmin flag', () => {
    useAuthStore.getState().loginWithRole('normal');
    useAuthStore.getState().setRole(true);
    expect(useAuthStore.getState().user.isCoopAdmin).toBe(true);
    expect(useAuthStore.getState().user.roleTitle).toBe('Admin User');

    useAuthStore.getState().setRole(false);
    expect(useAuthStore.getState().user.isCoopAdmin).toBe(false);
    expect(useAuthStore.getState().user.roleTitle).toBe('Co-op Member');
  });

  test('can login as Sunil Fernando (member2) and retains identity', () => {
    const sunil = useAuthStore.getState().loginWithRole('member2');

    expect(sunil.name).toBe('Sunil Fernando');
    expect(sunil.email).toBe(PRESET_USERS.member2.email);
    expect(sunil.isCoopAdmin).toBe(false);
    expect(useAuthStore.getState().user.name).toBe('Sunil Fernando');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test('logout clears user state', () => {
    useAuthStore.getState().loginWithRole('admin');
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
