import React from "react";
import { View, Text } from "react-native";
import Svg, { Polyline, Circle } from "react-native-svg";

export default function TrendChart({ history, forecastValue, width = 300, height = 130 }) {
  if (!history || history.length === 0) return null;

  const values = history.map((h) => h.usageKwh);
  const allValues = forecastValue !== undefined ? [...values, forecastValue] : values;
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const padding = 16;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const totalSteps = history.length - 1 + (forecastValue !== undefined ? 1 : 0);
  const stepX = totalSteps > 0 ? chartWidth / totalSteps : 0;

  const toY = (val) => padding + chartHeight - ((val - minVal) / range) * chartHeight;
  const toX = (index) => padding + index * stepX;

  const points = history.map((h, i) => `${toX(i)},${toY(h.usageKwh)}`).join(" ");
  const lastIndex = history.length - 1;
  const forecastLine = forecastValue !== undefined
    ? `${toX(lastIndex)},${toY(history[lastIndex].usageKwh)} ${toX(lastIndex + 1)},${toY(forecastValue)}`
    : null;

  return (
    <View>
      <Svg width={width} height={height}>
        <Polyline points={points} fill="none" stroke="#1F6F4B" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {history.map((h, i) => (
          <Circle key={h.month} cx={toX(i)} cy={toY(h.usageKwh)} r={4} fill="#1F6F4B" />
        ))}
        {forecastLine && (
          <Polyline points={forecastLine} fill="none" stroke="#F2A93B" strokeWidth={3} strokeDasharray="6,5" strokeLinecap="round" />
        )}
        {forecastValue !== undefined && (
          <Circle cx={toX(lastIndex + 1)} cy={toY(forecastValue)} r={5} fill="#F2A93B" />
        )}
      </Svg>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-muted">{history[0].month}</Text>
        <Text className="text-xs text-sun font-semibold">
          {forecastValue !== undefined ? "Projected →" : history[lastIndex].month}
        </Text>
      </View>
    </View>
  );
}