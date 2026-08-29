import { filterProposalsBySearch, formatProposalDate, getProposalTimingText } from '../utils/community';

const searchableProposals = [
  { id: 'active-id', title: 'Battery storage expansion', summary: 'Store extra solar energy.', status: 'active' },
  { id: 'upcoming-id', title: 'Roof upgrade', summary: 'Install solar shade panels.', status: 'upcoming' },
  { description: 'Replace outdated community meters.', id: 'closed-id', title: 'Meter replacement', summary: 'Improve metering accuracy.', status: 'closed' },
];

describe('proposal timing display', () => {
  test('shows precise remaining time instead of rounding to tomorrow', () => {
    const proposal = { status: 'active', votingDeadline: '2026-08-29T14:20:00.000Z' };
    const now = new Date('2026-08-29T08:00:00.000Z');

    expect(getProposalTimingText(proposal, now)).toBe('Time remaining: 6 hours 20 minutes');
  });

  test('shows days and hours when more than one day remains', () => {
    const proposal = { status: 'active', votingDeadline: '2026-08-31T11:30:00.000Z' };
    const now = new Date('2026-08-29T08:00:00.000Z');

    expect(getProposalTimingText(proposal, now)).toBe('Time remaining: 2 days 3 hours');
  });

  test('includes the selected local time in the displayed deadline', () => {
    const value = '2026-08-29T14:20:00.000Z';
    const expected = new Date(value).toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric' }).replace(',', ' ·');

    expect(formatProposalDate(value)).toBe(expected);
  });
});

describe('proposal search', () => {
  test('matches an exact proposal title', () => {
    expect(filterProposalsBySearch(searchableProposals, 'Battery storage expansion').map((proposal) => proposal.id)).toEqual(['active-id']);
  });

  test('matches a partial title without case or surrounding-space sensitivity', () => {
    expect(filterProposalsBySearch(searchableProposals, '  BATTERY  ').map((proposal) => proposal.id)).toEqual(['active-id']);
  });

  test('matches a summary keyword', () => {
    expect(filterProposalsBySearch(searchableProposals, 'shade').map((proposal) => proposal.id)).toEqual(['upcoming-id']);
  });

  test('matches a proposal description when it is available', () => {
    expect(filterProposalsBySearch(searchableProposals, 'outdated').map((proposal) => proposal.id)).toEqual(['closed-id']);
  });

  test('combines search with active, upcoming, and closed lifecycle selections', () => {
    expect(filterProposalsBySearch(searchableProposals.filter((proposal) => proposal.status === 'active'), 'battery').map((proposal) => proposal.id)).toEqual(['active-id']);
    expect(filterProposalsBySearch(searchableProposals.filter((proposal) => proposal.status === 'upcoming'), 'shade').map((proposal) => proposal.id)).toEqual(['upcoming-id']);
    expect(filterProposalsBySearch(searchableProposals.filter((proposal) => proposal.status === 'closed'), 'meter').map((proposal) => proposal.id)).toEqual(['closed-id']);
  });

  test('returns the original proposals when a search is cleared', () => {
    expect(filterProposalsBySearch(searchableProposals, '   ')).toBe(searchableProposals);
  });
});
