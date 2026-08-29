import { formatProposalDate, getProposalTimingText } from '../utils/community';

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
