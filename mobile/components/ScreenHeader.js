import React from "react";
import { View, Text } from "react-native";

export default function ScreenHeader({ eyebrow, title, subtitle }) {
  return (
    <View className="mb-6">
      {eyebrow ? (
        <Text className="text-xs font-semibold tracking-widest text-primary uppercase mb-1">{eyebrow}</Text>
      ) : null}
      <Text className="text-3xl font-bold text-ink mb-1">{title}</Text>
      {subtitle ? <Text className="text-base text-muted leading-5">{subtitle}</Text> : null}
    </View>
  );
}