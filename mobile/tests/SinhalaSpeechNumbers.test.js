import { buildProposalSpeech, normalizeSinhalaSpeechNumbers as speak } from '../utils/proposalSpeech';

test.each([
  ['5 kW', 'පහ කිලෝවොට්'], ['2.50 kWh', 'දෙක දශම පහ බිංදුව කිලෝවොට් පැය'],
  ['12.5%', 'සියයට දොළහ දශම පහ'], ['LKR 50,000', 'රුපියල් දහස් පනහ'],
  ['Rs. 25.05', 'රුපියල් විසි පහ දශම බිංදුව පහ'],
  ['-2.5', 'ඍණ දෙක දශම පහ'], ['18:30', 'පස්වරු පැය හය මිනිත්තු තිහ'],
  ['12:00 AM', 'පෙරවරු පැය දොළහ හරියටම'], ['12:00 PM', 'පස්වරු පැය දොළහ හරියටම'],
  ['2026-09-30', 'වර්ෂය දෙදහස් විසි හය, සැප්තැම්බර් මස, දින තිහ'],
])('%s has context-specific Sinhala narration', (input, expected) => expect(speak(input)).toBe(expected));

test.each(['03/04/2026', 'H02-SOLAR', '0771234567', '2026-02-30', '25:99', '5e3', 'https://example.com/2026', '1,23,456'])('ambiguous or invalid expression %s is retained', (input) => expect(speak(input)).toBe(input));

test('original fields and English narration remain unchanged', () => {
  const description = 'සූර්ය බලශක්ති පද්ධතිය 5 kW සහ 12.5%';
  const proposal = { title: 'සූර්ය බලශක්තිය', description };
  expect(buildProposalSpeech(proposal).text).toContain('පහ කිලෝවොට්');
  expect(proposal.description).toBe(description);
  expect(buildProposalSpeech({ title: 'Solar', description: '5 kW' }).text).toContain('5 kW');
});
