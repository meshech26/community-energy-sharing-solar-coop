import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";

function getRecentMonths(count = 6) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    months.push({ value, label });
  }
  return months;
}

export default function LogProgressScreen({ navigation }) {
  const { logProgress, loading, error } = useSustainabilityStore();
  const recentMonths = getRecentMonths(6);
  const [month, setMonth] = useState(recentMonths[recentMonths.length - 1].value);
  const [usageKwh, setUsageKwh] = useState("");

  const handleSubmit = async () => {
    const usage = Number(usageKwh);
    if (!usage || usage < 0) return;
    const { success, badges } = await logProgress(month, usage);
    if (success) {
      if (badges?.length > 0) Alert.alert("New badge earned! 🏅", badges.join(", "));
      navigation.navigate("Progress");
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface px-6">
      <ScreenHeader eyebrow="Monthly entry" title="Log your usage" />

      <Text className="text-sm font-semibold text-ink mb-2">Month</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ paddingRight: 12 }}>
        {recentMonths.map((m) => {
          const selected = m.value === month;
          return (
            <Pressable
              key={m.value}
              onPress={() => setMonth(m.value)}
              className={`px-4 py-2.5 rounded-full mr-2 border ${selected ? "bg-primary border-primary" : "bg-white border-border"}`}
            >
              <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-ink"}`}>{m.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text className="text-sm font-semibold text-ink mb-2">Usage (kWh)</Text>
      <TextInput
        className="border border-border rounded-2xl px-4 py-4 text-lg text-ink bg-white mb-6"
        keyboardType="numeric"
        value={usageKwh}
        onChangeText={setUsageKwh}
        placeholder="e.g. 150"
      />

      {error && <Text className="text-danger mb-4">{error}</Text>}

      <PrimaryButton label="Save entry" onPress={handleSubmit} loading={loading} />
    </SafeAreaView>
  );
}