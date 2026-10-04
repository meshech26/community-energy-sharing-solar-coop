import React from "react";
import { View, Text, Pressable } from "react-native";

export default function SegmentedToggle({ options, value, onChange }) {
  return (
    <View className="flex-row bg-border/40 rounded-full p-1 mb-6">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 py-2.5 rounded-full items-center ${selected ? "bg-white" : ""}`}
            style={selected ? { shadowColor: "#16241C", shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 } : {}}
          >
            <Text className={`text-sm font-semibold ${selected ? "text-primary" : "text-muted"}`}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}