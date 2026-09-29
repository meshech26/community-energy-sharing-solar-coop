import { useState } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const chartColors = {
  yes: '#1F8A5B',
  no: '#C6535D',
  abstain: '#C68A1A',
};

export default function ResultsDonutChart({ abstainVotes, noVotes, totalVotes, yesVotes }) {
  const { fontScale } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(188);
  const size = Math.min(188, availableWidth);
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Number(totalVotes) || 0;
  const entries = [
    { key: 'yes', value: Number(yesVotes) || 0 },
    { key: 'no', value: Number(noVotes) || 0 },
    { key: 'abstain', value: Number(abstainVotes) || 0 },
  ];
  let cumulative = 0;

  return (
    <View onLayout={({ nativeEvent }) => { if (nativeEvent.layout.width > 0) setAvailableWidth(nativeEvent.layout.width); }} accessible accessibilityRole="image" accessibilityLabel={`${total} total votes: ${yesVotes} yes, ${noVotes} no, ${abstainVotes} abstain`} style={styles.wrap}>
      <Svg testID="results-donut" {...(Platform.OS === 'web' ? { 'aria-hidden': true, tabIndex: -1 } : { accessible: false })} height={size} width={size}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle cx={center} cy={center} fill="none" r={radius} stroke="#E9EFEB" strokeWidth={strokeWidth} />
          {entries.map((entry) => {
            if (total === 0 || entry.value === 0) return null;
            const fraction = entry.value / total;
            const arcLength = Math.max(0, (fraction * circumference) - 3);
            const circle = (
              <Circle
                cx={center}
                cy={center}
                fill="none"
                key={entry.key}
                r={radius}
                stroke={chartColors[entry.key]}
                strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                strokeDashoffset={-cumulative * circumference}
                strokeLinecap="round"
                strokeWidth={strokeWidth}
              />
            );
            cumulative += fraction;
            return circle;
          })}
        </G>
      </Svg>
      <View style={[styles.centerLabel, (fontScale > 1.3 || size < 160 || String(total).length > 5) && styles.expandedLabel]}>
        <Text style={styles.total}>{total}</Text>
        <Text style={styles.totalLabel}>TOTAL VOTES</Text>
      </View>
    </View>
  );
}

export { chartColors };

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 16 },
  centerLabel: { alignItems: 'center', justifyContent: 'center', position: 'absolute', pointerEvents: 'none' },
  expandedLabel: { position: 'relative', marginTop: 12 },
  total: { color: '#173322', fontSize: 30, fontWeight: '700' },
  totalLabel: { color: '#627168', fontSize: 10, fontWeight: '500', letterSpacing: 0.7, marginTop: 3 },
});
