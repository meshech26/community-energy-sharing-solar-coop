import { buildProposalSpeech, formatSinhalaSpeechCost } from '../utils/proposalSpeech';

test.each([
  [0, 'බිංදුව'], [50, 'පනහ'], [2500, 'දහස් දෙක, පන්සිය'],
  [50000, 'දහස් පනහ'], [100000, 'ලක්ෂ එක'],
  [1800000, 'ලක්ෂ දහඅට'], [10000000, 'කෝටි එක'],
  [1825500, 'ලක්ෂ දහඅට, දහස් විසි පහ, පන්සිය'],
  ['50000', 'දහස් පනහ'], [2500.6, 'දහස් දෙක, පන්සිය එක'],
])('estimated cost %s is narrated in Sinhala words', (value, expected) => {
  expect(formatSinhalaSpeechCost(value)).toBe(expected);
  expect(formatSinhalaSpeechCost(value)).not.toMatch(/[0-9]|undefined|null/);
});

test.each([undefined, null, '', 'invalid', -1, Infinity, true])('invalid cost %s is omitted', (value) => {
  expect(formatSinhalaSpeechCost(value)).toBe('');
});

test('only Sinhala cost narration changes, not source fields or other languages', () => {
  const proposal = { title: 'සූර්ය බලශක්ති යෝජනාව', estimatedCost: 1800000 };
  expect(buildProposalSpeech(proposal).text).toContain('ඇස්තමේන්තුගත පිරිවැය: ලක්ෂ දහඅට');
  expect(proposal.estimatedCost).toBe(1800000);
  expect(buildProposalSpeech({ ...proposal, title: 'Solar proposal' }).text).toContain('1,800,000');
});
