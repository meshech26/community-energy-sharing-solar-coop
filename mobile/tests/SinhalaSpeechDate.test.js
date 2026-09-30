import { buildProposalSpeech, formatSinhalaSpeechDate } from '../utils/proposalSpeech';

test('Sinhala dates spell out year, month, day, hour and minutes without abbreviations', () => {
  const text = formatSinhalaSpeechDate(new Date(2026, 8, 30, 11, 4));
  expect(text).toContain('දෙදහස් විසි හය');
  expect(text).toContain('සැප්තැම්බර්');
  expect(text).toContain('දින තිහ');
  expect(text).toContain('පෙරවරු පැය එකොළහ මිනිත්තු හතර');
  expect(text).not.toMatch(/[0-9]|AM|PM|පෙ\.ව|ප\.ව/);
});

test.each([[0, 'පෙරවරු'], [12, 'පස්වරු'], [23, 'පස්වරු']])('hour %s retains the correct day period', (hour, period) => {
  expect(formatSinhalaSpeechDate(new Date(2026, 9, 1, hour, 0))).toContain(period);
  expect(formatSinhalaSpeechDate(new Date(2026, 9, 1, hour, 0))).toContain('හරියටම');
});

test('invalid and absent dates are omitted', () => {
  for (const value of [undefined, null, '', 'invalid']) expect(formatSinhalaSpeechDate(value)).toBe('');
});

test('Sinhala narration uses spoken dates without altering original proposal fields', () => {
  const proposal = { title: 'සූර්ය බලශක්ති යෝජනාව', votingDeadline: new Date(2026, 8, 30, 18, 30).toISOString() };
  const original = { ...proposal };
  expect(buildProposalSpeech(proposal).text).toContain('පස්වරු පැය හය මිනිත්තු තිහ');
  expect(proposal).toEqual(original);
});
