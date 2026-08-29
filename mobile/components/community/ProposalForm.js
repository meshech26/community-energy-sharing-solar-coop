import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ErrorMessage from '../ErrorMessage';
import FormInput from '../FormInput';
import PrimaryButton from '../PrimaryButton';
import ProposalDateTimeField from './ProposalDateTimeField';

const emptyProposal = {
  title: '', summary: '', description: '', benefits: '', estimatedCost: '', householdImpact: '', votingStartDate: '', votingDeadline: '',
};

const textFields = ['title', 'summary', 'description', 'benefits', 'householdImpact'];

export default function ProposalForm({ initialValues, isSubmitting, onSubmit, submitLabel }) {
  const [form, setForm] = useState({ ...emptyProposal, ...initialValues });
  const [error, setError] = useState('');

  useEffect(() => { setForm({ ...emptyProposal, ...initialValues }); }, [initialValues]);

  const update = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = () => {
    if (textFields.some((field) => !form[field].trim())) return setError('Complete all proposal fields before saving.');
    if (form.estimatedCost === '' || !Number.isFinite(Number(form.estimatedCost)) || Number(form.estimatedCost) < 0) return setError('Enter a valid estimated cost.');
    const start = new Date(form.votingStartDate);
    const deadline = new Date(form.votingDeadline);
    if (Number.isNaN(start.getTime()) || Number.isNaN(deadline.getTime())) return setError('Enter valid voting dates and times.');
    if (start >= deadline) return setError('The voting deadline must be after the voting start date.');
    setError('');
    onSubmit({ ...form, estimatedCost: Number(form.estimatedCost) });
  };

  return (
    <View>
      <Text style={styles.groupTitle}>Proposal information</Text>
      <Text style={styles.groupDescription}>Explain the decision clearly for participating households.</Text>
      <FormInput label="Title" onChangeText={update('title')} placeholder="Proposal title" value={form.title} />
      <FormInput label="Summary" multiline numberOfLines={3} onChangeText={update('summary')} placeholder="A short overview for households" value={form.summary} />
      <FormInput label="Description" multiline numberOfLines={5} onChangeText={update('description')} placeholder="Describe the proposal" value={form.description} />
      <FormInput label="Expected Benefits" multiline numberOfLines={3} onChangeText={update('benefits')} placeholder="How the community will benefit" value={form.benefits} />
      <Text style={styles.groupTitle}>Cost and household impact</Text>
      <FormInput keyboardType="decimal-pad" label="Estimated Cost" onChangeText={update('estimatedCost')} placeholder="For example: 2500" value={String(form.estimatedCost)} />
      <FormInput label="Household Impact" multiline numberOfLines={3} onChangeText={update('householdImpact')} placeholder="What this means for participating households" value={form.householdImpact} />
      <Text style={styles.groupTitle}>Voting schedule</Text>
      <Text style={styles.dateHint}>Choose when voting opens and when it closes. Times use your device’s local time.</Text>
      <ProposalDateTimeField label="Voting starts" onChange={update('votingStartDate')} value={form.votingStartDate} />
      <ProposalDateTimeField label="Voting deadline" minimumDate={form.votingStartDate} onChange={update('votingDeadline')} value={form.votingDeadline} />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <PrimaryButton loading={isSubmitting} onPress={submit}>{submitLabel}</PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  groupTitle: { color: '#173322', fontSize: 16, fontWeight: '800', marginBottom: 5, marginTop: 6 },
  groupDescription: { color: '#627168', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  dateHint: { color: '#627168', fontSize: 13, lineHeight: 19, marginBottom: 12, marginTop: -2 },
});
