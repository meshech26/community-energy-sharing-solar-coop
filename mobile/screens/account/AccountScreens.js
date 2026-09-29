import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ErrorMessage from '../../components/ErrorMessage';
import api from '../../services/api';
import { refreshCurrentUser } from '../../services/currentUserService';
import { useAuthStore } from '../../store/authStore';

function Page({ title, children }) {
  return <ScreenContainer><ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{children}</ScrollView></ScreenContainer>;
}
const message = (error) => error?.response?.data?.message || 'Unable to reach Solar Share. Please try again.';
export function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const submit = async () => {
    if (lock.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please provide a valid email address.'); return; }
    lock.current = true; setBusy(true); setError('');
    try { const r = await api.post('/auth/forgot-password', { email: email.trim() }); setSuccess(r.data.message); }
    catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); }
  };
  return <Page title="Forgot password"><Text style={styles.body}>Enter the email associated with your Solar Share account.</Text><Card><FormInput label="Email" placeholder="Enter your email" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />{error ? <ErrorMessage>{error}</ErrorMessage> : null}{success ? <Text accessibilityLiveRegion="polite" style={styles.success}>{success}</Text> : null}<PrimaryButton loading={busy} onPress={submit}>Send Reset Link</PrimaryButton></Card><SecondaryButton onPress={() => navigation.navigate('Login')}>Sign in</SecondaryButton></Page>;
}
function PasswordScreen({ navigation, route, changing = false }) {
  const [currentPassword, setCurrent] = useState(''); const [newPassword, setNew] = useState(''); const [confirmPassword, setConfirm] = useState(''); const [error, setError] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const token = route?.params?.token;
  const submit = async () => {
    if (lock.current) return;
    if (changing && !currentPassword) { setError('Enter your current password.'); return; }
    if (!newPassword.trim() || newPassword.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      await api.post(changing ? '/auth/change-password' : '/auth/reset-password', { newPassword, confirmPassword, ...(changing ? { currentPassword } : { token }) });
      setCurrent(''); setNew(''); setConfirm(''); setDone(true);
    } catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); }
  };
  const invalid = !changing && (!/^[a-f0-9]{64}$/.test(token || '') || error === 'This password reset link is invalid or has expired.');
  return <Page title={done ? 'Password updated' : changing ? 'Change password' : 'Reset password'}>{done ? <Card style={styles.successCard}><MaterialCommunityIcons accessible={false} name="check-circle-outline" color="#16764C" size={32} /><Text accessibilityLiveRegion="polite" style={styles.body}>Your password has been changed successfully.</Text>{!changing ? <Text style={styles.body}>You can now sign in with your new password.</Text> : null}<SecondaryButton onPress={() => navigation.navigate(changing ? 'MyAccount' : 'Login')}>{changing ? 'Return to account' : 'Sign in'}</SecondaryButton></Card> : invalid ? <><ErrorMessage>This password reset link is invalid or has expired.</ErrorMessage><SecondaryButton onPress={() => navigation.navigate('ForgotPassword')}>Request a new reset</SecondaryButton></> : <Card>{changing ? <FormInput label="Current password" autoComplete="current-password" secureTextEntry value={currentPassword} onChangeText={setCurrent} /> : null}<FormInput label="New password" autoComplete="new-password" secureTextEntry value={newPassword} onChangeText={setNew} /><FormInput label="Confirm new password" autoComplete="new-password" secureTextEntry value={confirmPassword} onChangeText={setConfirm} />{error ? <ErrorMessage>{error}</ErrorMessage> : null}<PrimaryButton loading={busy} onPress={submit}>{changing ? 'Update Password' : 'Reset Password'}</PrimaryButton></Card>}</Page>;
}
export function ResetPasswordScreen(props) { return <PasswordScreen {...props} />; }
export function ChangePasswordScreen(props) { return <PasswordScreen {...props} changing />; }
export function MyAccountScreen({ navigation }) {
  const user = useAuthStore((state) => state.user); const logout = useAuthStore((state) => state.logout);
  const [household, setHousehold] = useState(''); const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true; setError('');
    (async () => { try { await refreshCurrentUser(); const r = await api.get('/auth/account'); if (active) { useAuthStore.getState().updateUser(r.data.user); setHousehold(r.data.user.householdName); } } catch (e) { if (active) setError(message(e)); } })();
    return () => { active = false; };
  }, []));
  return <Page title="My Account">{error ? <ErrorMessage>{error}</ErrorMessage> : null}<Card><Text style={styles.name}>{user?.name}</Text><Text style={styles.body}>{user?.email}</Text><Text style={styles.label}>Household</Text><Text style={styles.body}>{household || 'Loading household…'}</Text><Text style={styles.label}>Membership</Text><Text style={styles.body}>{user?.isCoopAdmin === true ? 'Household Member + Co-op Admin' : 'Household Member'}</Text></Card><PrimaryButton onPress={() => navigation.navigate('ChangePassword')}>Change Password</PrimaryButton><SecondaryButton onPress={logout}>Log Out</SecondaryButton></Page>;
}
const styles = StyleSheet.create({ page: { padding: 20, gap: 16 }, successCard: { gap: 12 }, title: { fontSize: 24, fontWeight: '700', color: '#29332E' }, name: { fontSize: 18, fontWeight: '600', color: '#29332E' }, label: { fontSize: 14, fontWeight: '600', marginTop: 16, color: '#29332E' }, body: { fontSize: 14, lineHeight: 21, color: '#526158' }, success: { color: '#14633F', fontSize: 14, lineHeight: 21, marginBottom: 12 } });
