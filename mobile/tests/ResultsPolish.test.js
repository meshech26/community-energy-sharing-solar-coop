import { cleanup, fireEvent, render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import ResultsSummary from '../components/community/ResultsSummary';
import ResultsDonutChart from '../components/community/ResultsDonutChart';

afterEach(() => { cleanup(); jest.restoreAllMocks(); });
const results = { finalDecision: 'Tied', yesVotes: 1, noVotes: 1, abstainVotes: 0, totalVotes: 2, participatingHouseholds: 2, eligibleHouseholds: 26, participationRate: 7.69 };

test.each(['Approved', 'Rejected', 'Tied'])('%s results preserve all metrics and expose textual category summaries', async (finalDecision) => {
  const view = await render(<ResultsSummary results={{ ...results, finalDecision }} />);
  expect(view.getByText(finalDecision)).toHaveStyle({ fontWeight: '700' });
  expect(view.getByText('2 of 26 households')).toBeTruthy();
  expect(view.getByText('7.69%')).toHaveStyle({ fontSize: 30 });
  for (const summary of ['Yes: 1 votes, 50%', 'No: 1 votes, 50%', 'Abstain: 0 votes, 0%']) expect(view.getByLabelText(summary)).toBeTruthy();
  expect(view.getByRole('image', { name: '2 total votes: 1 yes, 1 no, 0 abstain' })).toBeTruthy();
});

test('zero-vote results keep all category rows and percentages', async () => {
  const view = await render(<ResultsSummary results={{ ...results, yesVotes: 0, noVotes: 0, totalVotes: 0, participatingHouseholds: 0, participationRate: 0 }} />);
  for (const category of ['Yes', 'No', 'Abstain']) expect(view.getByLabelText(`${category}: 0 votes, 0%`)).toBeTruthy();
});

test.each([[320, 1], [390, 1], [320, 2]])('donut fits %spx viewport at %sx text scale', async (width, fontScale) => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height: 700, scale: 1, fontScale });
  const view = await render(<ResultsDonutChart yesVotes={1} noVotes={1} abstainVotes={0} totalVotes={2} />);
  const chart = view.getByRole('image');
  await fireEvent(chart, 'layout', { nativeEvent: { layout: { width: 140, height: 200 } } });
  expect(view.getByText('TOTAL VOTES').parent).toHaveStyle({ position: 'relative' });
  const svg = view.getByTestId('results-donut', { includeHiddenElements: true });
  expect(svg.props.width).toBe(140);
  expect(svg.props.height).toBe(140);
});
