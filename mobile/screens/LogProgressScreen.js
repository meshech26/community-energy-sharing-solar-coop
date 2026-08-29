import React, { useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";

function getCurrentMonthDefault() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function LogProgressScreen({ navigation }) {
  const { logProgress, loading, error } = useSustainabilityStore();
  const [month, setMonth] = useState(getCurrentMonthDefault());
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
    <View className="flex-1 bg-surface px-6 pt-16">
      <ScreenHeader eyebrow="Monthly entry" title="Log your usage" />

      <Text className="text-sm font-semibold text-ink mb-2">Month (YYYY-MM)</Text>
      <TextInput
        className="border border-border rounded-2xl px-4 py-4 text-lg text-ink bg-white mb-6"
        value={month}
        onChangeText={setMonth}
        placeholder="2026-08"
      />

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
    </View>
  );
}