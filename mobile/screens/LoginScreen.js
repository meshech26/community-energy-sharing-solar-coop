import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import BrandMark from '../components/BrandMark';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const friendlyError = (error, fallback) => {
  if (!error?.response) {
    return 'Unable to reach Solar Share. Check your connection and try again.';
  }

  return error.response.data?.message || fallback;
};

export default function LoginScreen({ navigation }) {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      login(currentUser.data.user || user, token);
    } catch (requestError) {
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
            <SectionHeader description="Sign in to take part in your community energy co-op." title="Welcome back" />

            <Card>
              <FormInput autoComplete="email" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" testID="login-email" value={email} />
              <FormInput autoComplete="current-password" label="Password" onChangeText={setPassword} placeholder="Your password" secureTextEntry testID="login-password" value={password} />
              {error ? <ErrorMessage>{error}</ErrorMessage> : null}
              <PrimaryButton loading={isSubmitting} onPress={submit} testID="login-submit">Sign In</PrimaryButton>
            </Card>

            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
              <Text style={styles.linkText}>New to Solar Share? <Text style={styles.linkEmphasis}>Create an account</Text></Text>
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
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 30 },
  brand: { color: '#173322', fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  linkButton: { alignSelf: 'center', marginTop: 24, padding: 8 },
  linkText: { color: '#627168', fontSize: 14 },
  linkEmphasis: { color: '#14633F', fontWeight: '700' },
});
