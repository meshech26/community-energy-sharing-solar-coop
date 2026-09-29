import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SearchField from '../../components/SearchField';
import ScreenContainer from '../../components/ScreenContainer';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { Card, screenSpacing } from '../../components/community/CommunityUI';
import { getAdminTransferSummary, getEligibleAdminMembers, nominateAdministrator, respondToAdminTransfer } from '../../services/adminTransferService';
import { useAuthStore } from '../../store/authStore';
import { getCommunityError } from '../../utils/community';

export default function ManageCoopAdminScreen({ embedded = false }) {
  const isAdmin = useAuthStore((state) => state.user?.isCoopAdmin);
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true); setError('');
    try {
      const [data, eligible] = await Promise.all([getAdminTransferSummary(), getEligibleAdminMembers()]);
      setSummary(data); setMembers(eligible);
    } catch (err) { setError(getCommunityError(err, 'Unable to load administrator details. Please try again.')); }
    finally { setLoading(false); }
  }, [isAdmin]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const confirm = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (confirmation === 'cancel') await respondToAdminTransfer(summary.pendingRequest.id, 'cancel');
      else await nominateAdministrator(selected.id);
      setSelected(null); setSelecting(false); setConfirmation(null);
      await load();
    } catch (err) { setConfirmation(null); setError(getCommunityError(err, 'Unable to update the transfer request. Please refresh and try again.')); }
    finally { setBusy(false); }
  };
  if (!isAdmin) return <ScreenContainer><Text>Only the current administrator can manage role transfers.</Text></ScreenContainer>;
  const visibleMembers = members.filter((member) => `${member.name} ${member.email} ${member.householdName || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const content = <><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    {loading ? <LoadingState label="Loading administrator…" /> : null}
    {error ? <View><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={load}>Try again</SecondaryButton></View> : null}
    {summary ? <>
      <Card style={styles.roleCard}><Text style={styles.heading}>Current Administrator</Text><Text style={styles.name}>{summary.currentAdmin.name}</Text><Text style={styles.body}>{summary.currentAdmin.email}</Text><View style={styles.roleBadge}><MaterialCommunityIcons name="account-tie-outline" size={18} color="#356FA3" /><Text style={styles.roleLabel}>Co-op Administrator</Text></View></Card>
      {summary.pendingRequest ? <Card style={styles.pendingCard}><Text style={[styles.heading, styles.pendingText]}>Pending Administrator Transfer</Text><Text style={styles.name}>{summary.pendingRequest.targetUser?.name || 'Member no longer available'}</Text>{summary.pendingRequest.targetUser?.email ? <Text style={styles.body}>{summary.pendingRequest.targetUser.email}</Text> : null}<View style={styles.statusRow}><MaterialCommunityIcons name="clock-outline" size={18} color="#9A690F" /><Text style={[styles.pendingText, styles.statusLabel]}>Awaiting response</Text></View><Text style={styles.body}>You remain the administrator until the member accepts.</Text><SecondaryButton disabled={busy} onPress={() => setConfirmation('cancel')}>Cancel Request</SecondaryButton></Card>
        : !selecting ? <PrimaryButton tone="administrator" onPress={() => setSelecting(true)}>Transfer Administrator Role</PrimaryButton> : <>
          <Text style={styles.heading}>Select new Co-op Administrator</Text>
          <SearchField label="Search members" clearLabel="Clear member search" value={query} onChangeText={setQuery} accentColor="#356FA3" />
          {visibleMembers.length === 0 ? <Text style={styles.body}>{members.length ? 'No members match your search.' : 'No eligible members available.'}</Text> : null}
          {visibleMembers.map((member) => <Pressable key={member.id} accessibilityRole="radio" accessibilityLabel={`Select ${member.name}, ${member.email}`} accessibilityState={{ checked: selected?.id === member.id }} onPress={() => setSelected(member)} style={[styles.member, selected?.id === member.id && styles.selected]}>
            <MaterialCommunityIcons name={selected?.id === member.id ? 'radiobox-marked' : 'radiobox-blank'} size={24} color="#356FA3" />
            <View style={styles.memberText}><Text style={styles.name}>{member.name}</Text><Text style={styles.body}>{member.email}</Text>{member.householdName ? <Text style={styles.body}>{member.householdName}</Text> : null}</View>
          </Pressable>)}
          <PrimaryButton tone="administrator" disabled={!selected || busy} onPress={() => setConfirmation('send')}>Review transfer</PrimaryButton>
          <SecondaryButton onPress={() => { setSelecting(false); setSelected(null); }}>Cancel</SecondaryButton>
        </>}
    </> : null}
  </ScrollView><ConfirmationDialog confirmTone="administrator" destructive={confirmation === 'cancel'} visible={Boolean(confirmation)} title={confirmation === 'cancel' ? 'Cancel transfer request?' : 'Review Administrator Transfer'} confirmLabel={confirmation === 'cancel' ? 'Cancel Request' : 'Send Transfer Request'} onCancel={() => setConfirmation(null)} onConfirm={confirm} isConfirming={busy}>
    {confirmation === 'cancel' ? 'The member will no longer be able to accept this request. Your administrator role will not change.' : `Current Administrator: ${summary?.currentAdmin.name}\nProposed Administrator: ${selected?.name}\n\n${selected?.name} will receive a request. You remain the administrator until they accept.`}
  </ConfirmationDialog></>;
  return embedded ? content : <ScreenContainer edges={['left', 'right']}>{content}</ScreenContainer>;
}
const styles = StyleSheet.create({
  page: { ...screenSpacing, gap: 20 }, heading: { color: '#356FA3', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  roleCard: { borderColor: '#C8DCEA' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', flexWrap: 'wrap', gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EAF2F8' },
  roleLabel: { color: '#356FA3', fontSize: 13, fontWeight: '600' },
  pendingCard: { backgroundColor: '#FFF4DE', borderColor: '#9A690F' }, pendingText: { color: '#8A5A00' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }, statusLabel: { fontSize: 14, fontWeight: '600' },
  name: { color: '#173322', fontSize: 16, fontWeight: '600' }, body: { color: '#526158', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DDE5DF', borderRadius: 12, padding: 14, backgroundColor: '#FFFFFF' },
  selected: { borderColor: '#356FA3', backgroundColor: '#EAF2F8' }, memberText: { flex: 1 },
});
