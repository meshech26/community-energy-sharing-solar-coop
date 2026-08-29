import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

export default function PrimaryButton({ label, onPress, loading, variant = "solid", disabled }) {
  const isOutline = variant === "outline";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-2xl py-4 items-center ${isOutline ? "border border-primary bg-white" : "bg-primary"} ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? "#1F6F4B" : "white"} />
      ) : (
        <Text className={`text-base font-semibold ${isOutline ? "text-primary" : "text-white"}`}>{label}</Text>
      )}
    </Pressable>
  );
}