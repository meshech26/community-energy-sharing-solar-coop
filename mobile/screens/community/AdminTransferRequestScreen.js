import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { Card, screenSpacing } from '../../components/community/CommunityUI';
import { useNotifications } from '../../components/community/NotificationProvider';
import { getAdminTransfer, respondToAdminTransfer } from '../../services/adminTransferService';
import { refreshCurrentUser } from '../../services/currentUserService';
import { useAuthStore } from '../../store/authStore';
import { getCommunityError } from '../../utils/community';

export default function AdminTransferRequestScreen({ route, navigation }) {
  const id = route.params.transferRequestId;
  const userId = useAuthStore((state) => state.user?.id);
  const { refresh } = useNotifications();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRequest(await getAdminTransfer(id)); }
    catch (err) { setError(getCommunityError(err, 'Unable to load this administrator request.')); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const respond = async (action) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const updated = await respondToAdminTransfer(id, action);
      setRequest(updated); setConfirming(false);
      // A failed role refresh must never suggest that a committed transfer failed.
      try { await refreshCurrentUser(); }
      catch { setError('The request was updated. Your permissions will refresh shortly.'); }
      await refresh();
    } catch (err) { setConfirming(false); setError(getCommunityError(err, 'Unable to respond. Please refresh and try again.')); }
    finally { setBusy(false); }
  };
  const isTarget = request?.targetUser?.id === userId;
  return <ScreenContainer edges={['left', 'right']}><ScrollView contentContainerStyle={styles.page}>
    {loading ? <LoadingState label="Loading request…" /> : null}
    {error ? <><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={load}>Try again</SecondaryButton></> : null}
    {request ? <Card>
      <Text style={styles.heading}>{request.status === 'accepted' ? 'Administrator role accepted' : 'Administrator role request'}</Text>
      {request.status === 'pending' ? <>
        <Text style={[styles.pending, { color: '#8A5A00' }]}>Awaiting response</Text>
        <Text style={styles.body}>{request.currentAdmin?.name || 'The administrator'} nominated {isTarget ? 'you' : request.targetUser?.name || 'this member'} to become the Co-op Administrator.</Text>
        <Text style={styles.body}>The administrator manages community proposals and related administrative functions. Household membership and voting rights stay unchanged.</Text>
        {isTarget ? <View style={{ gap: 10 }}><PrimaryButton tone="administrator" disabled={busy} onPress={() => setConfirming(true)}>Accept</PrimaryButton><SecondaryButton disabled={busy} onPress={() => respond('decline')}>Decline</SecondaryButton></View> : <Text style={styles.body}>Awaiting response.</Text>}
      </> : <Text accessibilityLiveRegion="polite" style={styles.body}>{request.status === 'accepted' ? (isTarget ? 'You are now the Co-op Administrator.' : `${request.targetUser?.name || 'The nominated member'} is now the Co-op Administrator.`) : request.status === 'declined' ? 'Administrator request declined.' : 'This administrator request was cancelled.'}</Text>}
    </Card> : null}
    <SecondaryButton onPress={() => navigation.navigate('CommunityHome')}>Back to Community</SecondaryButton>
  </ScrollView><ConfirmationDialog confirmTone="administrator" visible={confirming} title="Accept Co-op Administrator role?" confirmLabel="Accept Role" onCancel={() => setConfirming(false)} onConfirm={() => respond('accept')} isConfirming={busy}>You will gain administrative permissions for Solar Share. The previous administrator will remain a Household Member.</ConfirmationDialog></ScreenContainer>;
}
const styles = StyleSheet.create({ page: { ...screenSpacing, gap: 20 }, heading: { color: '#356FA3', fontSize: 20, fontWeight: '700', marginBottom: 12 }, pending: { color: '#9A690F', backgroundColor: '#FFF4DE', alignSelf: 'flex-start', borderRadius: 8, padding: 8, marginBottom: 12, fontWeight: '600' }, body: { color: '#526158', fontSize: 16, lineHeight: 24, marginBottom: 16 } });
