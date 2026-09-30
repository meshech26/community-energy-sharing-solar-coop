import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Modal from '../AccessibleModal';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { buildProposalSpeechSegments, chunkSpeech, selectSpeechVoice, speechLanguages } from '../../utils/proposalSpeech';

// Expo Speech has a shared native queue. Serialize stops, including focus cleanup.
let stopQueue = Promise.resolve();
function stopSpeech() {
  const stopped = stopQueue.catch(() => {}).then(() => Speech.stop());
  stopQueue = stopped;
  return stopped;
}
const speeds = [0.75, 1, 1.25];

export default function ProposalReadAloud({ proposal, onActiveSegmentChange }) {
  const segments = useMemo(() => buildProposalSpeechSegments(proposal), [proposal]);
  const signature = JSON.stringify(segments);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const narration = segments[segmentIndex];
  const notify = useRef(onActiveSegmentChange);
  notify.current = onActiveSegmentChange;
  const pending = useRef(false);
  const [state, setState] = useState('idle');
  const [rate, setRate] = useState(1);
  const [showSpeeds, setShowSpeeds] = useState(false);
  const speedButton = useRef(null);
  const [anchor, setAnchor] = useState(null);
  const { width, height } = useWindowDimensions();
  const openSpeeds = () => {
    setShowSpeeds(true);
    speedButton.current?.measureInWindow((x, y, buttonWidth, buttonHeight) => {
      if (!focused.current) return;
      setAnchor({ x, y, buttonWidth, buttonHeight });
    });
  };
  const [message, setMessage] = useState('');
  const [reduceMotion, setReduceMotion] = useState(true);
  const focused = useRef(false);
  const generation = useRef(0);
  const watchdog = useRef(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const animation = useRef(null);
  const stopVisuals = useCallback(() => {
    clearTimeout(watchdog.current);
    animation.current?.stop();
    pulse.setValue(1);
  }, [pulse]);
  const stop = useCallback((update = true) => {
    generation.current += 1;
    notify.current?.(null);
    const stoppedSession = generation.current;
    pending.current = false;
    stopVisuals();
    if (update && focused.current) { setState('idle'); setShowSpeeds(false); }
    return stopSpeech().catch(() => {
      if (update && focused.current && generation.current === stoppedSession) setMessage('Unable to stop narration. Try again or close this screen.');
    });
  }, [stopVisuals]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    setState('idle'); setSegmentIndex(0); setShowSpeeds(false); setMessage('');
    return () => { focused.current = false; void stop(false); };
  }, [stop, signature, proposal?.id, proposal?._id]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => { if (next !== 'active') void stop(); });
    return () => subscription.remove();
  }, [stop]);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setReduceMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { alive = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (state === 'reading' && !reduceMotion) {
      animation.current = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.07, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
      ]));
      animation.current.start();
    }
    return () => { animation.current?.stop(); pulse.setValue(1); };
  }, [state, reduceMotion, pulse]);

  const start = async (nextRate = rate, index = segmentIndex) => {
    if (pending.current || !focused.current) return;
    const segment = segments[index];
    pending.current = true;
    const session = ++generation.current;
    const current = () => focused.current && session === generation.current;
    stopVisuals(); setState('loading'); setShowSpeeds(false); setMessage(''); setRate(nextRate); setSegmentIndex(index); notify.current?.(null);
    const fail = (copy = 'Unable to read this proposal. Please try again. You can still read it below.') => {
      if (!current()) return;
      void stop(); setMessage(copy);
    };
    // Also handles engines that never report onStart or never finish voice discovery.
    watchdog.current = setTimeout(() => fail('Narration did not start. Check your device speech settings and try again.'), 10000);
    try {
      await stopSpeech();
      if (!current()) return;
      if (!segment?.text) { fail('There is no proposal content to read yet.'); return; }
      const voices = await Speech.getAvailableVoicesAsync();
      if (!current()) return;
      const voice = selectSpeechVoice(voices, segment.language);
      if (!voice) { fail(`${speechLanguages[segment.language]} narration is unavailable on this device. Check installed text-to-speech voices, then try again.`); return; }
      const chunks = chunkSpeech(segment?.text, Speech.maxSpeechInputLength);
      let utterance = 0;
      const speakChunk = (chunkIndex) => {
        const ticket = ++utterance;
        const valid = () => current() && ticket === utterance;
        if (!current()) return;
        clearTimeout(watchdog.current);
        watchdog.current = setTimeout(() => fail('Narration did not start. Check your device speech settings and try again.'), 10000);
        try {
          Speech.speak(chunks[chunkIndex], {
            language: segment.language, voice: voice.identifier, rate: nextRate,
            onStart: () => { if (valid()) { pending.current = false; clearTimeout(watchdog.current); setState('reading'); notify.current?.({ key: segment.key, label: segment.label }); } },
            onDone: () => {
              if (!valid()) return;
              utterance += 1;
              if (chunkIndex + 1 < chunks.length) speakChunk(chunkIndex + 1);

              else if (index + 1 < segments.length) { pending.current = false; void start(nextRate, index + 1); }
              else { notify.current?.(null); generation.current += 1; pending.current = false; stopVisuals(); setState('idle'); setShowSpeeds(false); }
            },
            onStopped: () => { if (valid()) { notify.current?.(null); generation.current += 1; pending.current = false; stopVisuals(); setState('idle'); setShowSpeeds(false); } },
            onError: () => { if (valid()) fail(); },
          });
        } catch { fail(); }
      };
      speakChunk(0);
    } catch { fail(); }
  };

  const active = state !== 'idle';
  const busy = state === 'loading';
  const status = state === 'reading' ? 'Listening to proposal' : 'Preparing narration…';
  return <View style={styles.wrap}>
    {active ? <View style={styles.player}>
      <View style={styles.playerHeading}><Animated.View accessible={false} style={{ transform: [{ scale: pulse }] }}><MaterialCommunityIcons accessible={false} name="volume-high" color="#16764C" size={20} /></Animated.View><Text accessibilityLiveRegion="polite" accessibilityLabel={`${status}, ${speechLanguages[narration?.language]}`} style={styles.label}>{state === 'reading' ? 'Listening' : 'Preparing narration…'} · <Text style={styles.language}>{speechLanguages[narration?.language]}</Text></Text></View>
      <View style={[styles.row, styles.playerControls]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Stop reading proposal" onPress={() => void stop()} style={[styles.control, styles.playbackControl]}><MaterialCommunityIcons accessible={false} name="stop" color="#14633F" size={18} /><Text style={styles.label}>Stop</Text></Pressable>
        <Pressable ref={speedButton} accessibilityRole="button" accessibilityLabel={`Reading speed, ${rate} times`} accessibilityHint="Changing speed restarts the current passage." accessibilityState={{ expanded: showSpeeds, disabled: busy }} disabled={busy} onPress={openSpeeds} style={[styles.control, styles.playbackControl, busy && styles.disabled]}><Text style={styles.label}>Speed · {rate}×</Text><MaterialCommunityIcons accessible={false} name={showSpeeds ? "chevron-up" : "chevron-down"} color="#14633F" size={18} /></Pressable>
      </View>
    </View> : <Pressable accessibilityRole="button" accessibilityLabel="Listen to proposal" onPress={() => void start(rate, 0)} style={styles.listen}><MaterialCommunityIcons accessible={false} name="volume-high" size={20} color="#16764C" /><Text style={styles.label}>Listen to proposal</Text></Pressable>}
    {message ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{message}</Text> : null}
    {active && showSpeeds ? <Modal visible transparent animationType="fade" accessibilityLabel="Reading speed" onRequestClose={() => setShowSpeeds(false)}>
      <View style={styles.backdrop}>
        <Pressable testID="speed-dismiss" accessible={false} focusable={false} tabIndex={-1} importantForAccessibility="no" onPress={() => setShowSpeeds(false)} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal onAccessibilityEscape={() => setShowSpeeds(false)} style={[styles.speedDialog, { width: Math.min(260, width - 24), left: Math.max(12, Math.min(anchor?.x || 12, width - Math.min(260, width - 24) - 12)), ...(anchor && anchor.y > height / 2 ? { bottom: Math.max(12, height - anchor.y + 6), maxHeight: Math.max(44, anchor.y - 18) } : { top: (anchor?.y || 0) + (anchor?.buttonHeight || 44) + 6, maxHeight: Math.max(44, height - (anchor?.y || 0) - (anchor?.buttonHeight || 44) - 18) }) }]}>
          <ScrollView contentContainerStyle={styles.speedContent}>
            <View style={styles.row}>{speeds.map((speed) => <Pressable key={speed} accessibilityRole="radio" accessibilityLabel={`${speed} times reading speed`} accessibilityState={{ checked: speed === rate }} onPress={() => { if (speed === rate) setShowSpeeds(false); else void start(speed); }} style={[styles.control, speed === rate && styles.selected]}><Text style={styles.label}>{speed}×</Text></Pressable>)}</View>
          </ScrollView>
        </View>
      </View>
    </Modal> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, marginBottom: 20 },
  listen: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#BFD5C6', maxWidth: '100%' },
  player: { borderRadius: 12, borderWidth: 1, borderColor: '#DDE5DF', padding: 16, gap: 16, backgroundColor: '#F1F8F3' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#14633F', flexShrink: 1 },
  playerHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerControls: { gap: 12 },
  playbackControl: { flexGrow: 1, flexBasis: 110, minHeight: 48, paddingHorizontal: 14 },
  language: { color: '#526158', fontWeight: '400' },
  disabled: { opacity: 0.6 },
  control: { flexDirection: 'row', gap: 6, minHeight: 44, minWidth: 44, maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#BFD5C6', borderRadius: 8, backgroundColor: '#FFFFFF' },
  selected: { backgroundColor: '#E2F3E9', borderColor: '#16764C' },
  backdrop: { flex: 1 },
  speedDialog: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#BFD5C6', boxShadow: '0px 3px 10px rgba(22, 74, 45, 0.12)' },
  speedContent: { padding: 12, gap: 10 },
  feedback: { fontSize: 14, lineHeight: 21, color: '#526158', marginTop: 8 },
});
