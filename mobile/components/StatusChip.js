import React from "react";
import { View, Text } from "react-native";

const TONES = {
  primary: { bg: "bg-primary-light", text: "text-primary" },
  sun: { bg: "bg-sun-light", text: "text-sun" },
  sky: { bg: "bg-sky-light", text: "text-sky" },
};

export default function StatusChip({ label, tone = "primary" }) {
  const t = TONES[tone] ?? TONES.primary;
  return (
    <View className={`self-start px-3 py-1.5 rounded-full mr-2 mb-2 ${t.bg}`}>
      <Text className={`text-xs font-semibold ${t.text}`}>{label}</Text>
    </View>
  );
}