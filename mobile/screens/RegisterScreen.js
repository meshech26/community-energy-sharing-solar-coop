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

export default function RegisterScreen({ navigation }) {
  const login = useAuthStore((state) => state.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password || !invitationCode.trim()) {
      setError('Complete all fields to create your account.');
      return;
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        invitationCode: invitationCode.trim(),
      });
      const { token, user } = response.data;
      const currentUser = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });

      login(currentUser.data.user || user, token);
    } catch (requestError) {
      setError(friendlyError(requestError, 'We could not create your account. Please try again.'));
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
              <BrandMark size={48} />
              <Text style={styles.brand}>Solar Share</Text>
            </View>
            <SectionHeader description="Use the household invitation code provided by your co-op." title="Join your community" />

            <Card>
              <FormInput autoComplete="name" autoCapitalize="words" label="Full Name" onChangeText={setName} placeholder="Your full name" testID="register-name" value={name} />
              <FormInput autoComplete="email" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" testID="register-email" value={email} />
              <FormInput autoComplete="new-password" label="Password" onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry testID="register-password" value={password} />
              <FormInput autoCapitalize="characters" label="Household Invitation Code" onChangeText={setInvitationCode} placeholder="For example: H01-SOLAR" testID="register-invitation-code" value={invitationCode} />
              {error ? <ErrorMessage>{error}</ErrorMessage> : null}
              <PrimaryButton loading={isSubmitting} onPress={submit} testID="register-submit">Create Account</PrimaryButton>
            </Card>

            <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.linkButton}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkEmphasis}>Sign in</Text></Text>
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
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 26 },
  brand: { color: '#173322', fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  linkButton: { alignSelf: 'center', marginTop: 24, padding: 8 },
  linkText: { color: '#627168', fontSize: 14 },
  linkEmphasis: { color: '#14633F', fontWeight: '700' },
});
