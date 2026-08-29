import React from "react";
import { View, Text } from "react-native";

export default function BadgeChip({ label }) {
  return (
    <View className="bg-sun-light border border-sun/30 rounded-full px-3 py-1.5 mr-2 mb-2">
      <Text className="text-sun text-xs font-semibold">🏅 {label}</Text>
    </View>
  );
}