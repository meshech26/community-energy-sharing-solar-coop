import React from "react";
import { View } from "react-native";

export default function Card({ children, className = "" }) {
  return (
    <View
      className={`bg-white rounded-3xl p-5 border border-border ${className}`}
      style={{ shadowColor: "#16241C", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
    >
      {children}
    </View>
  );
}