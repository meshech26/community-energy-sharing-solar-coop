import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Card, screenSpacing } from '../../components/community/CommunityUI';
import PrimaryButton from '../../components/PrimaryButton';
import SearchField from '../../components/SearchField';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import { listHouseholds, createHousehold } from '../../services/householdService';
import { useAuthStore } from '../../store/authStore';
import { getCommunityError } from '../../utils/community';

export default function HouseholdManagementScreen() {
  const insets = useSafeAreaInsets();
  const isAdmin = useAuthStore((state) => state.user?.isCoopAdmin === true);
  const [households, setHouseholds] = useState([]);
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [search, setSearch] = useState('');
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  useEffect(() => {
    if (!copyStatus) return;
    const timer = setTimeout(() => setCopyStatus(''), 5000);
    return () => clearTimeout(timer);
  }, [copyStatus]);
  const submitting = useRef(false);
  const load = useCallback(async (pullToRefresh = false) => {
    if (!isAdmin) return;
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try { setHouseholds(await listHouseholds()); }
    catch (err) { setError(getCommunityError(err, 'Unable to load households. Please try again.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isAdmin]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const create = async () => {
    if (!isAdmin || submitting.current) return;
    if (!name.trim()) { setError('Enter a household name.'); return; }
    submitting.current = true; setBusy(true); setError(''); setCopyStatus('');
    try {
      const household = await createHousehold(name.trim());
      setCreated(household); setHouseholds((items) => [household, ...items.filter((item) => item.id !== household.id)]); setName('');
    } catch (err) { setError(getCommunityError(err, 'Unable to create the household. Please try again.')); }
    finally { submitting.current = false; setBusy(false); }
  };
  const copy = async (household) => {
    try {
      const copied = await Clipboard.setStringAsync(household.invitationCode);
      setCopyStatus({ id: household.id, message: copied === false ? 'Copy is unavailable. Select the code to copy it manually.' : `Code copied for ${household.name}.` });
    } catch { setCopyStatus({ id: household.id, message: 'Copy is unavailable. Select the code to copy it manually.' }); }
  };
  if (!isAdmin) return <Text style={styles.body}>Only the current Co-op Administrator can manage household invitations.</Text>;
  const query = search.trim().toLowerCase();
  const visibleHouseholds = households.filter((item) => query ? item.name.toLowerCase().includes(query) : item.id !== created?.id);
  const householdCard = (household, isNew = false) => <Card key={household.id} style={isNew ? styles.card : styles.compactCard}>
    {isNew ? <View style={styles.successRow}><MaterialCommunityIcons accessible={false} name="check-circle-outline" size={18} color="#14633F" /><Text accessibilityLiveRegion="polite" style={styles.success}>Household created</Text></View> : null}
    <Text style={styles.name}>{household.name}</Text>
    {isNew ? <Text style={styles.label}>Invitation code</Text> : null}
    <View style={styles.codeRow}>
      <Text selectable style={styles.code}>{household.invitationCode}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Copy invitation code for ${household.name}`} onPress={() => copy(household)} style={({ pressed }) => [styles.copyButton, pressed && styles.copyPressed]}><Text style={styles.copyLabel}>Copy</Text></Pressable>
    </View>
    {copyStatus.id === household.id ? <Text accessibilityLiveRegion="polite" style={styles.body}>{copyStatus.message}</Text> : null}
  </Card>;
  // The non-overlay tab navigator reserves its own height; only add safe-area breathing room.
  return <ScrollView testID="household-scroll" style={styles.scroll} alwaysBounceVertical contentContainerStyle={[styles.page, { paddingBottom: screenSpacing.paddingBottom + insets.bottom }]} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl testID="household-pull-refresh" refreshing={refreshing} onRefresh={() => load(true)} tintColor="#6A5D9F" colors={['#6A5D9F']} />}>
    <Text style={styles.body}>Share invitation codes privately with household members.</Text>
    <Card style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>Add Household</Text>
      <Text style={styles.label}>Household name (required)</Text>
      <TextInput accessibilityLabel="Household name" placeholder="Enter household name" value={name} onChangeText={setName} maxLength={100} editable={!busy} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} style={[styles.input, nameFocused && styles.inputFocused]} />
      <PrimaryButton tone="household" loading={busy} onPress={create} icon="plus">Create Household</PrimaryButton>
    </Card>
    {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    {created && !query ? householdCard(created, true) : null}
    <View style={styles.listSection}>
    <Text accessibilityRole="header" style={styles.heading}>Participating households</Text>
    <SearchField label="Search households" clearLabel="Clear household search" value={search} onChangeText={setSearch} accentColor="#6A5D9F" />
    {loading ? <LoadingState label="Loading households…" /> : null}
    {!loading && !error && !query && households.length === 0 ? <Text style={styles.body}>No households yet. Add a participating household to get started.</Text> : null}
    {!loading && !error && query && visibleHouseholds.length === 0 ? <View><Text style={styles.name}>No households found</Text><Text style={styles.body}>Try another household name.</Text></View> : null}
    <View style={styles.list}>{visibleHouseholds.map((item) => householdCard(item, item.id === created?.id))}</View>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  page: { ...screenSpacing, gap: 16 }, card: { gap: 8 }, heading: { color: '#29332E', fontSize: 16, fontWeight: '600' },
  name: { color: '#29332E', fontSize: 16, fontWeight: '600' }, label: { color: '#526158', fontSize: 14, fontWeight: '600' },
  body: { color: '#526158', fontSize: 14, lineHeight: 21 }, success: { color: '#14633F', fontWeight: '600', fontSize: 14, flexShrink: 1 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  list: { gap: 10 },
  listSection: { gap: 10 },
  compactCard: { gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, shadowOpacity: 0, boxShadow: 'none', elevation: 0 },
  codeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  copyButton: { minHeight: 44, minWidth: 60, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#6A5D9F', borderRadius: 8 },
  copyPressed: { backgroundColor: '#F2EFF8' },
  copyLabel: { color: '#554A82', fontSize: 14, fontWeight: '600' },
  code: { flexShrink: 1, color: '#554A82', backgroundColor: '#F2EFF8', borderWidth: 1, borderColor: '#D8D2E8', padding: 8, borderRadius: 8, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  inputFocused: { borderColor: '#6A5D9F', outlineColor: '#6A5D9F' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#DDE5DF', borderRadius: 12, padding: 12, fontSize: 14, color: '#29332E', backgroundColor: '#FFFFFF' },
});
