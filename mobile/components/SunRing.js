import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

export default function SunRing({ percent = 0, size = 168, strokeWidth = 14, label, sublabel }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center self-center">
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F2A93B" />
            <Stop offset="100%" stopColor="#1F6F4B" />
          </LinearGradient>
        </Defs>
        <Circle stroke="#EDEAE0" fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <Circle
          stroke="url(#sunGradient)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute" }} className="items-center">
        <Text className="text-3xl font-bold text-ink">{label}</Text>
        {sublabel ? <Text className="text-xs text-muted mt-1">{sublabel}</Text> : null}
      </View>
    </View>
  );
}