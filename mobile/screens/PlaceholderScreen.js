import { ScrollView, StyleSheet } from 'react-native';

import EmptyState from '../components/EmptyState';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';

const content = {
  Dashboard: {
    icon: 'view-dashboard-outline',
    eyebrow: 'Your Solar Share',
    title: 'Dashboard',
    emptyTitle: 'Your energy community',
    description: 'Your Solar Share overview will appear here.',
  },
  'Energy Sharing': {
    icon: 'solar-power-variant-outline',
    eyebrow: 'Community energy',
    title: 'Energy Sharing',
    emptyTitle: 'Energy sharing activity',
    description: 'View and manage community energy-sharing activity.',
  },
  Community: {
    icon: 'account-group-outline',
    eyebrow: 'Your co-op',
    title: 'Community',
    emptyTitle: 'Your community',
    description: 'View community proposals, take part in voting, and follow co-op decisions.',
  },
  'My Impact': {
    icon: 'chart-line-variant',
    eyebrow: 'Household progress',
    title: 'My Impact',
    emptyTitle: 'Your impact',
    description: 'Track your energy savings and sustainability progress.',
  },
};

export default function PlaceholderScreen({ area }) {
  const screen = content[area];

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader eyebrow={screen.eyebrow} title={screen.title} />
        <EmptyState description={screen.description} icon={screen.icon} title={screen.emptyTitle} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 },
});
