import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const chartColors = {
  yes: '#16764C',
  no: '#B14B56',
  abstain: '#B17B18',
};

export default function ResultsDonutChart({ abstainVotes, noVotes, totalVotes, yesVotes }) {
  const size = 188;
  const strokeWidth = 20;
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
    <View accessibilityLabel={`${total} total votes: ${yesVotes} yes, ${noVotes} no, ${abstainVotes} abstain`} style={styles.wrap}>
      <Svg height={size} width={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle cx={center} cy={center} fill="none" r={radius} stroke="#E8EDEA" strokeWidth={strokeWidth} />
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
      <View pointerEvents="none" style={styles.centerLabel}>
        <Text style={styles.total}>{total}</Text>
        <Text style={styles.totalLabel}>TOTAL VOTES</Text>
      </View>
    </View>
  );
}

export { chartColors };

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  centerLabel: { alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  total: { color: '#173322', fontSize: 30, fontWeight: '800', lineHeight: 35 },
  totalLabel: { color: '#6A776E', fontSize: 10, fontWeight: '800', letterSpacing: 0.7, marginTop: 1 },
});
