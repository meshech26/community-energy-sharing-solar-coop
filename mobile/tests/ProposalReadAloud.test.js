import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, AppState } from 'react-native';
import * as Speech from 'expo-speech';
import ProposalReadAloud from '../components/community/ProposalReadAloud';
import ProposalDetailsScreen from '../screens/community/ProposalDetailsScreen';
import { getProposal } from '../services/proposalService';
jest.mock('../services/proposalService', () => ({ getProposal: jest.fn(), getVoteStatus: jest.fn() }));
import { buildProposalSpeech, buildProposalSpeechSegments, chunkSpeech, detectSpeechLanguage, selectSpeechVoice } from '../utils/proposalSpeech';

let mockFocused = true;
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback) => require('react').useEffect(() => mockFocused ? callback() : undefined, [callback, mockFocused]),
}));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(), getAvailableVoicesAsync: jest.fn(), maxSpeechInputLength: 1000 }));
const proposal = { title: 'Community battery', summary: 'Store solar energy', description: 'Install a shared battery.', benefits: 'Lower costs', estimatedCost: 50000, householdImpact: 'More reliable power', proposer: { name: 'A member' }, votingStartDate: '2026-10-01T09:00:00Z', votingDeadline: '2026-10-20T09:00:00Z' };
const voices = ['en-AU', 'si-LK', 'ta-LK'].map((language) => ({ language, identifier: language }));
const latest = () => Speech.speak.mock.calls.at(-1)[1];
beforeEach(() => {
  jest.clearAllMocks(); mockFocused = true;
  Speech.stop.mockResolvedValue(); Speech.getAvailableVoicesAsync.mockResolvedValue(voices);
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
});
afterEach(async () => { await cleanup(); await act(async () => {}); jest.restoreAllMocks(); jest.useRealTimers(); });
const listen = async (view) => {
  await fireEvent.press(view.getByRole('button', { name: 'Listen to proposal' }));
  await waitFor(() => expect(Speech.speak).toHaveBeenCalled());
  await act(async () => latest().onStart());
};

test.each([
  ['Community battery installation', 'en-AU'],
  ['සූර්ය බලශක්ති යෝජනාව', 'si-LK'],
  ['சூரிய சக்தி திட்டம்', 'ta-LK'],
  ['සූර්ය Battery Project 2026', 'si-LK'],
  ['சூரிய Battery Project 2026', 'ta-LK'],
  ['A long English proposal mentioning a single character ක', 'en-AU'],
])('detects content language: %s', (text, language) => expect(detectSpeechLanguage(text)).toBe(language));

test('narration includes original fields, formatted cost and dates, without interface actions', () => {
  const { text, language } = buildProposalSpeech(proposal);
  expect(language).toBe('en-AU');
  for (const value of ['Community battery', 'Store solar energy', 'Install a shared battery.', 'Lower costs', '50,000', 'More reliable power', 'A member', '2026']) expect(text).toContain(value);
  expect(text).not.toMatch(/Vote Now|Archive|Delete|undefined|null/);
  expect(buildProposalSpeech({ title: 'Only title', estimatedCost: null }).text).toBe('Proposal: Only title.');
  expect(buildProposalSpeech({}).text).toBe('');
  expect(buildProposalSpeech({ title: 'NaN', summary: 'undefined', description: 'null' }).text).toBe('');
});

test('voice selection prefers exact locale then same language, never unrelated language', () => {
  expect(selectSpeechVoice(voices, 'ta-LK').identifier).toBe('ta-LK');
  expect(selectSpeechVoice([{ language: 'ta-IN', identifier: 'fallback' }], 'ta-LK').identifier).toBe('fallback');
  expect(selectSpeechVoice(voices.slice(0, 1), 'si-LK')).toBeUndefined();
});

test('Sinhala prefers enhanced voices within the correct locale without mutating the voice list', () => {
  const available = [{ language: 'si-LK', identifier: 'basic', quality: 'Default' }, { language: 'si-LK', identifier: 'enhanced', quality: 'Enhanced' }];
  expect(selectSpeechVoice(available, 'si-LK').identifier).toBe('enhanced');
  expect(available[0].identifier).toBe('basic');
});

test('long narration splits at sentence boundaries when possible', () => {
  const text = 'සූර්ය බලශක්තිය නිපදවයි. '.repeat(30);
  const chunks = chunkSpeech(text, 120);
  expect(chunks.every((chunk) => chunk.length <= 120)).toBe(true);
  expect(chunks[0].trim().endsWith('.')).toBe(true);
  expect(chunks.join(' ').replace(/\s+/g, ' ').trim()).toBe(text.trim());
});

test.each([['English title', 'en-AU'], ['සූර්ය බලශක්තිය', 'si-LK'], ['சூரிய சக்தி', 'ta-LK']])('speaks original %s content with matching locale', async (title, language) => {
  const view = await render(<ProposalReadAloud proposal={{ title }} />);
  await listen(view);
  expect(Speech.speak.mock.calls[0][0]).toContain(title);
  expect(latest()).toMatchObject({ language, voice: language, rate: 1 });
  expect(view.getByLabelText(`Listening to proposal, ${{ 'en-AU': 'English', 'si-LK': 'Sinhala', 'ta-LK': 'Tamil' }[language]}`)).toBeTruthy();
  await act(async () => latest().onDone());
  expect(view.getByRole('button', { name: 'Listen to proposal' })).toBeTruthy();
});

test('Stop cancels speech and stale callbacks cannot revive the player', async () => {
  const view = await render(<ProposalReadAloud proposal={proposal} />); await listen(view);
  const callbacks = latest(); const stops = Speech.stop.mock.calls.length;
  await fireEvent.press(view.getByRole('button', { name: 'Stop reading proposal' }));
  expect(Speech.stop.mock.calls.length).toBeGreaterThan(stops);
  await act(async () => { callbacks.onStart(); callbacks.onDone(); });
  expect(view.getByText('Listen to proposal')).toBeTruthy();
});

test('speed choices open temporarily and closing leaves narration unchanged', async () => {
  const view = await render(<ProposalReadAloud proposal={proposal} />); await listen(view);
  expect(view.queryByText('Changing speed restarts the current passage.')).toBeNull();
  const count = Speech.speak.mock.calls.length;
  expect(view.getByLabelText('Reading speed, 1 times').props.accessibilityHint).toBe('Changing speed restarts the current passage.');
  await fireEvent.press(view.getByLabelText('Reading speed, 1 times'));
  expect(view.queryByText('Changing speed restarts the current passage.')).toBeNull();
  expect(view.queryByRole('header', { name: 'Reading speed' })).toBeNull();
  expect(view.getAllByRole('radio')).toHaveLength(3);
  await fireEvent.press(view.getByTestId('speed-dismiss', { includeHiddenElements: true }));
  expect(view.queryByText('Changing speed restarts the current passage.')).toBeNull();
  expect(view.getByLabelText('Listening to proposal, English')).toBeTruthy();
  expect(Speech.speak).toHaveBeenCalledTimes(count);
});

test.each([0.75, 1.25, 1])('speed %s restarts only after stop resolves', async (speed) => {
  const view = await render(<ProposalReadAloud proposal={proposal} />); await listen(view);
  if (speed === 1) {
    await fireEvent.press(view.getByLabelText('Reading speed, 1 times'));
    await fireEvent.press(view.getByLabelText('0.75 times reading speed'));
    await waitFor(() => expect(latest().rate).toBe(0.75));
    await act(async () => latest().onStart());
  }
  let release;
  Speech.stop.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
  const previous = latest(); const count = Speech.speak.mock.calls.length;
  await fireEvent.press(view.getByLabelText(`Reading speed, ${speed === 1 ? 0.75 : 1} times`));
  await fireEvent.press(view.getByLabelText(`${speed} times reading speed`));
  expect(Speech.speak).toHaveBeenCalledTimes(count);
  await act(async () => previous.onDone());
  await act(async () => release());
  await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(count + 1));
  expect(latest().rate).toBe(speed);
});

test.each(['unmount', 'blur'])('%s stops narration', async (action) => {
  const view = await render(<ProposalReadAloud proposal={proposal} />); await listen(view);
  const count = Speech.stop.mock.calls.length;
  if (action === 'unmount') await view.unmount();
  else { mockFocused = false; await view.rerender(<ProposalReadAloud proposal={proposal} />); }
  expect(Speech.stop.mock.calls.length).toBeGreaterThan(count);
});

test('leaving during voice discovery prevents delayed narration', async () => {
  let resolve;
  Speech.getAvailableVoicesAsync.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const view = await render(<ProposalReadAloud proposal={proposal} />);
  await fireEvent.press(view.getByText('Listen to proposal'));
  await view.unmount();
  await act(async () => resolve(voices));
  expect(Speech.speak).not.toHaveBeenCalled();
});

test('engine error and missing voices show feedback and keep proposal reading available', async () => {
  const view = await render(<ProposalReadAloud proposal={proposal} />); await listen(view);
  await act(async () => latest().onError(new Error('private engine detail')));
  expect(view.getByText(/Unable to read this proposal/)).toBeTruthy();
  expect(view.queryByText(/private engine detail/)).toBeNull();
  Speech.getAvailableVoicesAsync.mockResolvedValueOnce([]);
  await fireEvent.press(view.getByRole('button', { name: 'Listen to proposal' }));
  expect(await view.findByText(/English narration is unavailable/)).toBeTruthy();
});

test('long content is chunked without queuing simultaneous utterances', async () => {
  const text = 'Long proposal. '.repeat(150);
  expect(chunkSpeech(text, 1000).every((chunk) => chunk.length <= 1000)).toBe(true);
  const view = await render(<ProposalReadAloud proposal={{ description: text }} />); await listen(view);
  expect(Speech.speak).toHaveBeenCalledTimes(1);
  await act(async () => latest().onDone());
  expect(Speech.speak).toHaveBeenCalledTimes(2);
});

test.each([true, false])('speaker animation respects reduced motion %s', async (reduced) => {
  AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(reduced);
  const start = jest.fn(); const stop = jest.fn();
  const loop = jest.spyOn(Animated, 'loop').mockReturnValue({ start, stop });
  const view = await render(<ProposalReadAloud proposal={proposal} />);
  expect(loop).not.toHaveBeenCalled(); await listen(view);
  expect(view.getByLabelText('Listening to proposal, English')).toBeTruthy();
  if (reduced) expect(loop).not.toHaveBeenCalled();
  else { expect(start).toHaveBeenCalled(); await act(async () => latest().onDone()); expect(stop).toHaveBeenCalled(); }
});

test('backgrounding stops speech and does not auto-resume', async () => {
  const subscription = jest.spyOn(AppState, 'addEventListener');
  const view = await render(<ProposalReadAloud proposal={proposal} />); await listen(view);
  const callback = subscription.mock.calls.find(([event]) => event === 'change')[1];
  await act(async () => callback('background'));
  expect(view.getByText('Listen to proposal')).toBeTruthy();
  const count = Speech.speak.mock.calls.length;
  await act(async () => callback('active'));
  expect(Speech.speak).toHaveBeenCalledTimes(count);
});

test('voice discovery rejection returns safely to idle', async () => {
  Speech.getAvailableVoicesAsync.mockRejectedValueOnce(new Error('engine unavailable'));
  const view = await render(<ProposalReadAloud proposal={proposal} />);
  await fireEvent.press(view.getByText('Listen to proposal'));
  expect(await view.findByText(/Unable to read this proposal/)).toBeTruthy();
  expect(view.getByRole('button', { name: 'Listen to proposal' })).toBeTruthy();
  expect(Speech.speak).not.toHaveBeenCalled();
});

test('speech startup timeout cancels a silent engine and permits retry', async () => {
  jest.useFakeTimers();
  const view = await render(<ProposalReadAloud proposal={proposal} />);
  await fireEvent.press(view.getByText('Listen to proposal'));
  await act(async () => {});
  expect(Speech.speak).toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(10000));
  expect(view.getByText(/Narration did not start/)).toBeTruthy();
  expect(view.getByRole('button', { name: 'Listen to proposal' })).toBeTruthy();
});

test('proposal replacement stops old content and reads only the new content', async () => {
  const view = await render(<ProposalReadAloud proposal={proposal} />); await listen(view);
  const previous = latest();
  await view.rerender(<ProposalReadAloud proposal={{ title: 'Replacement proposal' }} />);
  await act(async () => previous.onDone());
  await fireEvent.press(view.getByText('Listen to proposal'));
  await waitFor(() => expect(Speech.speak.mock.calls.at(-1)[0]).toBe('Proposal: Replacement proposal.'));
});

test('narrator uses device speech without fetching content and exposes only playback controls', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network must not be used'));
  const view = await render(<ProposalReadAloud proposal={proposal} />);
  expect(view.getAllByRole('button')).toHaveLength(1);
  await listen(view);
  expect(view.getAllByRole('button')).toHaveLength(2);
  expect(view.getByRole('button', { name: 'Stop reading proposal' })).toBeTruthy();
  expect(view.getByRole('button', { name: 'Reading speed, 1 times' })).toBeTruthy();
  expect(fetchSpy).not.toHaveBeenCalled();
});

test('duplicate startup taps cannot queue overlapping speech', async () => {
  let resolve;
  Speech.getAvailableVoicesAsync.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const view = await render(<ProposalReadAloud proposal={proposal} />);
  const button = view.getByRole('button', { name: 'Listen to proposal' });
  await act(async () => { await Promise.all([fireEvent.press(button), fireEvent.press(button)]); });
  await act(async () => resolve(voices));
  expect(Speech.speak).toHaveBeenCalledTimes(1);
});

test('segments skip missing fields and follow visible content order', () => {
  expect(buildProposalSpeechSegments(proposal).map(s => s.key)).toEqual(['title', 'summary', 'votingStartDate', 'votingDeadline', 'description', 'benefits', 'estimatedCost', 'householdImpact', 'proposer']);
  expect(buildProposalSpeechSegments({ title: 'Only title', benefits: {}, estimatedCost: {}, votingDeadline: {} })).toHaveLength(1);
  expect(buildProposalSpeechSegments({})).toEqual([]);
  expect(JSON.stringify(buildProposalSpeechSegments({ title: 'NaN', summary: 'undefined', description: 'null' }))).toBe('[]');
});

test('automatic mixed-language playback updates and clears current highlight without navigation controls', async () => {
  const input = { title: 'First', benefits: 'සූර්ය බලශක්තිය', householdImpact: 'சூரிய சக்தி' };
  const onActiveSegmentChange = jest.fn();
  const view = await render(<ProposalReadAloud proposal={input} onActiveSegmentChange={onActiveSegmentChange} />); await listen(view);
  expect(Speech.speak.mock.calls[0][0]).toBe('Proposal: First.');
  expect(onActiveSegmentChange).toHaveBeenLastCalledWith({ key: 'title', label: 'Title' });
  expect(view.queryByRole('button', { name: 'Previous proposal section' })).toBeNull();
  expect(view.queryByRole('button', { name: 'Next proposal section' })).toBeNull();
  await act(async () => latest().onDone());
  await waitFor(() => expect(latest().language).toBe('si-LK'));
  await act(async () => latest().onStart());
  expect(onActiveSegmentChange).toHaveBeenLastCalledWith({ key: 'benefits', label: 'Expected benefits' });
  await fireEvent.press(view.getByLabelText('Reading speed, 1 times'));
  await fireEvent.press(view.getByLabelText('1.25 times reading speed'));
  await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(3));
  expect(Speech.speak.mock.calls[2][0]).toBe(Speech.speak.mock.calls[1][0]);
  expect(latest().rate).toBe(1.25);
  await act(async () => { latest().onStart(); latest().onDone(); });
  await waitFor(() => expect(latest().language).toBe('ta-LK'));
  await act(async () => { latest().onStart(); latest().onDone(); });
  expect(onActiveSegmentChange).toHaveBeenLastCalledWith(null);
  expect(view.getByText('Listen to proposal')).toBeTruthy();
});

test('Stop clears highlight and blocks old auto-advance', async () => {
  const onActiveSegmentChange = jest.fn();
  const view = await render(<ProposalReadAloud proposal={proposal} onActiveSegmentChange={onActiveSegmentChange} />); await listen(view);
  const old = latest();
  await fireEvent.press(view.getByLabelText('Stop reading proposal'));
  expect(onActiveSegmentChange).toHaveBeenLastCalledWith(null);
  await act(async () => old.onDone());
  expect(Speech.speak).toHaveBeenCalledTimes(1);
});

test('Proposal Details highlights real content and clears it on Stop and completion', async () => {
  getProposal.mockResolvedValue({ id: 'voice-test', title: 'First', benefits: 'Second', status: 'closed' });
  const view = await render(<ProposalDetailsScreen navigation={{ navigate: jest.fn() }} route={{ params: { proposalId: 'voice-test' } }} />);
  await view.findByText('First');
  await listen(view);
  expect(view.getByTestId('narration-highlight')).toHaveStyle({ borderLeftWidth: 3, backgroundColor: '#F1F8F3' });
  expect(view.getByText('Reading: Title')).toHaveStyle({ position: 'absolute', width: 1, height: 1, overflow: 'hidden' });
  expect(view.getByText('Reading: Title').props.accessibilityLiveRegion).toBe('polite');
  await act(async () => latest().onDone());
  await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(2));
  await act(async () => latest().onStart());
  expect(view.queryByText('Reading: Title')).toBeNull();
  expect(view.getByText('Reading: Expected benefits')).toHaveStyle({ position: 'absolute', width: 1, height: 1, overflow: 'hidden' });
  expect(view.getAllByText('Second')).toHaveLength(1);
  await fireEvent.press(view.getByLabelText('Stop reading proposal'));
  expect(view.queryByTestId('narration-highlight')).toBeNull();
  await listen(view);
  await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(3));
  await act(async () => latest().onDone());
  await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(4));
  await act(async () => { latest().onStart(); latest().onDone(); });
  expect(view.queryByTestId('narration-highlight')).toBeNull();
});

test('repeated chunk completion cannot queue duplicate speech', async () => {
  const view = await render(<ProposalReadAloud proposal={{ description: 'Long proposal. '.repeat(150) }} />); await listen(view);
  const old = latest();
  await act(async () => { old.onDone(); old.onDone(); });
  expect(Speech.speak).toHaveBeenCalledTimes(2);
});
