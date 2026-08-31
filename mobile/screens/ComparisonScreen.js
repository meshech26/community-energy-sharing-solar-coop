import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import StatusChip from "../components/StatusChip";

export default function ComparisonScreen() {
  const { comparison, loadComparison, loading } = useSustainabilityStore();
  useEffect(() => { loadComparison(); }, []);

  if (loading && !comparison) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#1F6F4B" />
      </SafeAreaView>
    );
  }

  if (!comparison?.comparisonAvailable) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 items-center justify-center bg-surface px-8">
        <Text className="text-base text-muted text-center">
          {comparison?.message || "Log at least two months of usage to see a comparison."}
        </Text>
      </SafeAreaView>
    );
  }

  const { previousMonth, currentMonth, previousUsageKwh, currentUsageKwh, actualReductionPercent, targetPercentReduction, isAheadOfTarget } = comparison;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface px-6">
      <ScreenHeader eyebrow="Trend" title="Month over month" />

      <Card className="mb-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-xs text-muted mb-1">{previousMonth}</Text>
            <Text className="text-xl font-bold text-ink">{previousUsageKwh} kWh</Text>
          </View>
          <Text className="text-muted text-lg">→</Text>
          <View className="items-end">
            <Text className="text-xs text-muted mb-1">{currentMonth}</Text>
            <Text className="text-xl font-bold text-ink">{currentUsageKwh} kWh</Text>
          </View>
        </View>

        <Text className="text-sm text-muted mb-2">
          Actual reduction: {actualReductionPercent}% (target: {targetPercentReduction}%)
        </Text>
        <ProgressBar
          percent={(actualReductionPercent / targetPercentReduction) * 100}
          color={isAheadOfTarget ? "bg-primary" : "bg-sun"}
        />
      </Card>

      <StatusChip tone={isAheadOfTarget ? "primary" : "sun"} label={isAheadOfTarget ? "Ahead of target" : "Behind target"} />
      <Text className="text-sm text-muted mt-2 leading-5">
        {isAheadOfTarget
          ? "Great work — you're ahead of your target this month."
          : "You're a little behind this month — check the tip on your dashboard."}
      </Text>
    </SafeAreaView>
  );
}