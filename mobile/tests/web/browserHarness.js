// Local-only browser fixture. Not imported by the application or export entry.
// Uses real navigation and UI components; no API, auth store or database writes.
import { useState } from 'react';
import { registerRootComponent } from 'expo';
import { Button, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import navigationFocusLayout from '../../navigation/NavigationFocusLayout';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import ProposalDateTimeField from '../../components/community/ProposalDateTimeField';
import ResultsDonutChart from '../../components/community/ResultsDonutChart';

const Stack = createNativeStackNavigator();
function Results({ navigation }) {
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState('Ready');
  const [date, setDate] = useState('2026-09-27T10:15:00Z');
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
    <Text accessibilityRole="header">Accessibility browser fixture</Text>
    <Text>{lastAction}</Text>
    <ResultsDonutChart yesVotes={5} noVotes={2} abstainVotes={1} totalVotes={8} />
    <Button title="Open confirmation" onPress={() => { setLastAction('Opened confirmation'); setOpen(true); }} />
    <Button title="Open details" onPress={() => navigation.navigate('Details')} />
    <ProposalDateTimeField label="Voting starts" value={date} onChange={setDate} />
    <ConfirmationDialog visible={open} title="Test confirmation" cancelLabel="Keep Editing" confirmLabel="Continue to details" onCancel={() => { setLastAction('Cancelled confirmation'); setOpen(false); }} onConfirm={() => { setOpen(false); navigation.navigate('Details'); }}>
      This fixture does not publish or change any proposal.
    </ConfirmationDialog>
  </ScrollView>;
}
function Details({ navigation }) {
  return <View style={{ padding: 24, gap: 16 }}><Text accessibilityRole="header">Fixture details</Text><Button title="Back to results" onPress={() => navigation.goBack()} /></View>;
}
function Harness() {
  return <SafeAreaProvider><NavigationContainer><Stack.Navigator layout={navigationFocusLayout} screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Results" component={Results} /><Stack.Screen name="Details" component={Details} />
  </Stack.Navigator></NavigationContainer></SafeAreaProvider>;
}
registerRootComponent(Harness);
