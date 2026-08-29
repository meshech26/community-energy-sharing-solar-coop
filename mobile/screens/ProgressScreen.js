import React, { useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import Card from "../components/Card";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import SunRing from "../components/SunRing";
import BadgeChip from "../components/BadgeChip";

export default function ProgressScreen({ navigation }) {
  const { goal, progress, tip, comparison, loading, loadGoal, loadProgress, loadTip, loadComparison } =
    useSustainabilityStore();

  useEffect(() => {
    loadGoal();
    loadProgress();
    loadTip();
    loadComparison();
  }, []);

  if (loading && !progress) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#1F6F4B" />
      </View>
    );
  }

  if (!goal) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Text className="text-5xl mb-4">☀️</Text>
        <Text className="text-xl font-bold text-ink text-center mb-2">No goal set yet</Text>
        <Text className="text-base text-muted text-center mb-8">
          Set a monthly target to start tracking your CO2 offset and progress.
        </Text>
        <PrimaryButton label="Set a goal" onPress={() => navigation.navigate("SetGoal")} />
      </View>
    );
  }

  const ringPercent = comparison?.comparisonAvailable
    ? Math.min(100, (comparison.actualReductionPercent / comparison.targetPercentReduction) * 100)
    : 0;

  return (
    <ScrollView className="flex-1 bg-surface px-6 pt-16" contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenHeader
        eyebrow="Your impact"
        title="Sustainability"
        subtitle={`Target: ${goal.targetPercentReduction}% monthly reduction`}
      />

      <Card className="items-center mb-6">
        <SunRing
          percent={ringPercent}
          label={`${progress?.co2ToDateKg ?? 0}kg`}
          sublabel="CO2 offset to date"
        />
        <Text className="text-sm text-muted mt-4">
          ≈ {progress?.treesEquivalent ?? 0} trees planted equivalent
        </Text>
      </Card>

      <View className="flex-row mb-6">
        <Card className="flex-1 mr-2 items-center">
          <Text className="text-2xl font-bold text-primary">{progress?.currentStreakMonths ?? 0}</Text>
          <Text className="text-xs text-muted mt-1">Current streak (mo)</Text>
        </Card>
        <Card className="flex-1 ml-2 items-center">
          <Text className="text-2xl font-bold text-ink">{progress?.longestStreakMonths ?? 0}</Text>
          <Text className="text-xs text-muted mt-1">Longest streak (mo)</Text>
        </Card>
      </View>

      {progress?.badges?.length > 0 && (
        <View className="mb-6">
          <Text className="text-sm font-semibold text-ink mb-2">Badges earned</Text>
          <View className="flex-row flex-wrap">
            {progress.badges.map((b) => <BadgeChip key={b} label={b} />)}
          </View>
        </View>
      )}

      {tip && (
        <Card className="mb-6 bg-sky-light border-sky/20">
          <Text className="text-sm font-semibold text-sky mb-1">💡 Tip for you</Text>
          <Text className="text-sm text-ink leading-5">{tip}</Text>
        </Card>
      )}

      <View className="flex-row">
        <View className="flex-1 mr-2">
          <PrimaryButton label="Log this month" onPress={() => navigation.navigate("LogProgress")} />
        </View>
        <View className="flex-1 ml-2">
          <PrimaryButton label="Compare" variant="outline" onPress={() => navigation.navigate("Comparison")} />
        </View>
      </View>
    </ScrollView>
  );
}