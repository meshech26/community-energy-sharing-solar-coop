import React from "react";
import { View } from "react-native";

export default function ProgressBar({ percent = 0, color = "bg-primary" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View className="w-full h-2.5 bg-border rounded-full overflow-hidden">
      <View className={`h-2.5 rounded-full ${color}`} style={{ width: `${clamped}%` }} />
    </View>
  );
}