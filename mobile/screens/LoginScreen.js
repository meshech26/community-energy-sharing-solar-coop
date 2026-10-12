import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import BrandMark from '../components/BrandMark';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import api from '../services/api';
import { useAuthStore, PRESET_USERS } from '../store/authStore';

const friendlyError = (error, fallback) => {
  if (!error?.response) {
    return 'Unable to reach Solar Share. Check your connection and try again.';
  }

  return error.response.data?.message || fallback;
};

export default function LoginScreen({ navigation }) {
  const { login, loginWithRole } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState('normal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    const preset = PRESET_USERS[roleKey];
    if (preset) {
      setEmail(preset.email);
      setPassword('password123');
    }
  };

  const handleQuickLogin = (roleKey) => {
    loginWithRole(roleKey);
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter both your email address and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      const { token, user } = response.data;
      const currentUser = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });

      login(currentUser.data?.user || user, token);
    } catch (requestError) {
      // If network fails or user is testing with presets
      const matchedPresetKey = Object.keys(PRESET_USERS).find(
        (key) => PRESET_USERS[key].email.toLowerCase() === email.trim().toLowerCase()
      );
      if (matchedPresetKey && (!requestError.response || requestError.response.status >= 500)) {
        loginWithRole(matchedPresetKey);
        return;
      }
      setError(friendlyError(requestError, 'We could not sign you in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formColumn}>
            <View style={styles.brandLockup}>
              <BrandMark size={56} />
              <Text style={styles.brand}>Solar Share</Text>
            </View>
            <SectionHeader compact description="Sign in to your Solar Share account." title="Welcome back" />

            {/* Dev / Quick Role Selector */}
            <View style={styles.devBox}>
              <View style={styles.devHeader}>
                <Text style={styles.devTitle}>Quick Member Select (Testing)</Text>
                <View style={styles.devBadge}>
                  <Text style={styles.devBadgeText}>Dev Auth</Text>
                </View>
              </View>

              <View style={styles.roleTabs}>
                <TouchableOpacity
                  onPress={() => handleSelectRole('normal')}
                  style={[styles.roleTab, selectedRole === 'normal' && styles.roleTabActive]}
                >
                  <Text style={[styles.roleTabText, selectedRole === 'normal' && styles.roleTabTextActive]}>
                    Kavindi (Member 1)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectRole('member2')}
                  style={[styles.roleTab, selectedRole === 'member2' && styles.roleTabActive]}
                >
                  <Text style={[styles.roleTabText, selectedRole === 'member2' && styles.roleTabTextActive]}>
                    Sunil (Member 2)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectRole('admin')}
                  style={[styles.roleTab, selectedRole === 'admin' && styles.roleTabActive]}
                >
                  <Text style={[styles.roleTabText, selectedRole === 'admin' && styles.roleTabTextActive]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quickButtonsRow}>
                <TouchableOpacity onPress={() => handleQuickLogin('normal')} style={styles.quickBtn}>
                  <Text style={styles.quickBtnText}>⚡ 1-Tap Kavindi</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleQuickLogin('member2')} style={styles.quickBtn}>
                  <Text style={styles.quickBtnText}>⚡ 1-Tap Sunil</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleQuickLogin('admin')} style={[styles.quickBtn, styles.quickBtnAdmin]}>
                  <Text style={[styles.quickBtnText, styles.quickBtnAdminText]}>🛡️ 1-Tap Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Card>
              <FormInput
                autoComplete="email"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                placeholder="you@example.com"
                testID="login-email"
                value={email}
              />
              <FormInput
                autoComplete="current-password"
                label="Password"
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
                testID="login-password"
                value={password}
              />
              {error ? <ErrorMessage>{error}</ErrorMessage> : null}
              <PrimaryButton loading={isSubmitting} onPress={submit} testID="login-submit">
                Sign In
              </PrimaryButton>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.linkButton}
              >
                <Text style={styles.linkEmphasis}>Forgot password?</Text>
              </Pressable>
            </Card>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Register')}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                New to Solar Share? <Text style={styles.linkEmphasis}>Create an account</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  formColumn: { alignSelf: 'center', maxWidth: 440, width: '100%' },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 24 },
  brand: { color: '#173322', fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  devBox: {
    backgroundColor: '#F8FAF8',
    borderColor: '#DDE7E0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  devHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  devTitle: { fontSize: 11, fontWeight: '700', color: '#52665A', textTransform: 'uppercase' },
  devBadge: { backgroundColor: '#E0F0E5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  devBadgeText: { fontSize: 10, fontWeight: '700', color: '#1B6A3D' },
  roleTabs: { flexDirection: 'row', backgroundColor: '#E9EFEA', borderRadius: 8, padding: 3, marginBottom: 10 },
  roleTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  roleTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  roleTabText: { fontSize: 10, fontWeight: '600', color: '#627168' },
  roleTabTextActive: { color: '#16764C', fontWeight: '700' },
  quickButtonsRow: { flexDirection: 'row', gap: 6 },
  quickBtn: {
    flex: 1,
    backgroundColor: '#EBF5EE',
    borderColor: '#BFE0CC',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  quickBtnText: { fontSize: 10, fontWeight: '700', color: '#14633F' },
  quickBtnAdmin: { backgroundColor: '#F3EBF9', borderColor: '#DDC6EE' },
  quickBtnAdminText: { color: '#6A279B' },
  linkButton: { alignSelf: 'center', justifyContent: 'center', minHeight: 44, marginTop: 16, padding: 8 },
  linkText: { color: '#627168', fontSize: 14 },
  linkEmphasis: { color: '#14633F', fontWeight: '600' },
});
