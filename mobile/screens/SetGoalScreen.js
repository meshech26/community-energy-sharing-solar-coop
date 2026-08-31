import React, { useState, useEffect } from "react";
import { View, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";

export default function SetGoalScreen({ navigation }) {
  const { goal, loadGoal, createGoal, updateGoal, suggestedTarget, loadSuggestedTarget, loading, error } =
    useSustainabilityStore();
  const [target, setTarget] = useState("");
  const [usedSuggestion, setUsedSuggestion] = useState(true);

  useEffect(() => { loadGoal(); loadSuggestedTarget(); }, []);

  useEffect(() => {
    if (goal) setTarget(String(goal.targetPercentReduction));
    else if (suggestedTarget !== null) setTarget(String(suggestedTarget));
  }, [goal, suggestedTarget]);

  const handleSave = async () => {
    const value = Number(target);
    if (!value || value <= 0) return;
    const success = goal
      ? await updateGoal({ targetPercentReduction: value, suggestedByApp: usedSuggestion })
      : await createGoal(value, usedSuggestion);
    if (success) navigation.navigate("Progress");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface px-6">
      <ScreenHeader eyebrow={goal ? "Update" : "Get started"} title={goal ? "Update your goal" : "Set your goal"} />

      {suggestedTarget !== null && (
        <Card className="mb-6 bg-sun-light border-sun/20">
          <Text className="text-sm text-ink leading-5">
            Based on your usage, we suggest a <Text className="font-bold">{suggestedTarget}%</Text> reduction target.
          </Text>
        </Card>
      )}

      <Text className="text-sm font-semibold text-ink mb-2">Monthly reduction target (%)</Text>
      <TextInput
        className="border border-border rounded-2xl px-4 py-4 text-lg text-ink bg-white mb-2"
        keyboardType="numeric"
        value={target}
        onChangeText={(t) => { setTarget(t); setUsedSuggestion(false); }}
      />
      {suggestedTarget !== null && Number(target) !== suggestedTarget && (
        <Text className="text-primary text-sm mb-6" onPress={() => { setTarget(String(suggestedTarget)); setUsedSuggestion(true); }}>
          Use suggested {suggestedTarget}% instead
        </Text>
      )}

      {error && <Text className="text-danger mb-4">{error}</Text>}

      <View className="mt-4">
        <PrimaryButton label={goal ? "Update goal" : "Confirm and save goal"} onPress={handleSave} loading={loading} />
      </View>
    </SafeAreaView>
  );
}