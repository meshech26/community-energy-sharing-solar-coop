import { getProposalManagementState, selectAdminProposals } from '../utils/proposalManagement';

const records = ['draft', 'upcoming', 'active', 'cancelled', 'closed'].map((status) => ({ id: status, status }));
records.push({ id: 'archived', status: 'cancelled', archivedAt: '2026-09-15T09:00:00Z' });

test.each([
  ['Drafts', 'All', ['draft']],
  ['Published', 'All', ['upcoming', 'active']],
  ['Cancelled', 'All', ['cancelled']],
  ['History', 'All', ['closed', 'archived']],
  ['History', 'Closed', ['closed']],
  ['History', 'Archived', ['archived']],
])('shared grouping selects %s / %s without mutating records', (category, filter, expected) => {
  const original = JSON.stringify(records);
  expect(selectAdminProposals(records, category, filter).map((item) => item.id)).toEqual(expected);
  expect(JSON.stringify(records)).toBe(original);
});

test('archived records never expose administrative mutation states', () => {
  const state = getProposalManagementState(records[5]);
  expect(state).toEqual({ archived: true, closed: false, draft: false, published: false, cancelled: false, category: 'History' });
});
