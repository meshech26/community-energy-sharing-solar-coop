import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import { computeTrendForecast } from "../utils/forecastHelpers";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import StatusChip from "../components/StatusChip";
import TrendChart from "../components/TrendChart";

export default function ComparisonScreen() {
  const { comparison, progress, loadComparison, loadProgress, loading } = useSustainabilityStore();

  useEffect(() => { loadComparison(); loadProgress(); }, []);

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
  const forecast = computeTrendForecast(progress?.progressHistory);

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
        <ProgressBar percent={(actualReductionPercent / targetPercentReduction) * 100} color={isAheadOfTarget ? "bg-primary" : "bg-sun"} />
      </Card>

      <StatusChip tone={isAheadOfTarget ? "primary" : "sun"} label={isAheadOfTarget ? "Ahead of target" : "Behind target"} />
      <Text className="text-sm text-muted mt-2 mb-6 leading-5">
        {isAheadOfTarget
          ? "Great work — you're ahead of your target this month."
          : "You're a little behind this month — check the tip on your dashboard."}
      </Text>

      {forecast.forecastAvailable && (
        <Card className="mb-6">
          <Text className="text-sm font-semibold text-ink mb-1">Your trend & next-month forecast</Text>
          <Text className="text-xs text-muted mb-4">
            Based on a linear projection across all {forecast.sorted.length} logged months
          </Text>
          <TrendChart history={forecast.sorted} forecastValue={forecast.projectedUsageKwh} />
          <View className="flex-row items-center mt-4 bg-sun-light rounded-xl p-3">
            <Text className="text-2xl mr-3">{forecast.trendDirection === "decreasing" ? "📉" : forecast.trendDirection === "increasing" ? "📈" : "➖"}</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink">
                Projected: ~{forecast.projectedUsageKwh} kWh next month
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                ≈ {forecast.projectedCo2OffsetKg}kg CO2 offset — trend is {forecast.trendDirection}
              </Text>
            </View>
          </View>
        </Card>
      )}
    </SafeAreaView>
  );
}