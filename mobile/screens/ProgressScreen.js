import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import { useAuthStore } from "../store/authStore";
import { daysLeftInMonth } from "../utils/dateHelpers";
import Card from "../components/Card";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import SunRing from "../components/SunRing";
import BadgeChip from "../components/BadgeChip";
import SegmentedToggle from "../components/SegmentedToggle";
import ProgressBar from "../components/ProgressBar";

const TOTAL_POSSIBLE_BADGES = 6; // 3 streak badges + 3 CO2 badges, matching backend badgeCalculator.js

function computeCommunityScore(userCo2, coopAvgCo2) {
  if (!coopAvgCo2) return 50;
  const ratio = userCo2 / coopAvgCo2;
  return Math.min(100, Math.max(0, Math.round(ratio * 50)));
}

export default function ProgressScreen({ navigation }) {
  const { user } = useAuthStore();
  const { goal, progress, tip, insight, comparison, loading,
    loadGoal, loadProgress, loadTip, loadComparison, loadInsight } = useSustainabilityStore();
  const [view, setView] = useState("usage");
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    await Promise.all([loadGoal(), loadProgress(), loadTip(), loadComparison(), loadInsight()]);
  }, []);

  useEffect(() => { loadAll(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  if (loading && !progress) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#1F6F4B" />
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 items-center justify-center bg-surface px-8">
        <Text className="text-5xl mb-4">☀️</Text>
        <Text className="text-xl font-bold text-ink text-center mb-2">No goal set yet</Text>
        <Text className="text-base text-muted text-center mb-8">
          Set a monthly target to start tracking your CO2 offset and progress.
        </Text>
        <PrimaryButton label="Set a goal" onPress={() => navigation.navigate("SetGoal")} />
      </SafeAreaView>
    );
  }

  const ringPercent = comparison?.comparisonAvailable
    ? Math.min(100, (comparison.actualReductionPercent / comparison.targetPercentReduction) * 100)
    : 0;

  const latestEntry = progress?.progressHistory?.[progress.progressHistory.length - 1];
  const thisMonthCo2 = latestEntry?.co2OffsetKg ?? 0;

  const maxCo2 = Math.max(progress?.co2ToDateKg ?? 0, progress?.coopAverageCo2Kg ?? 0, 1);
  const youBarPercent = ((progress?.co2ToDateKg ?? 0) / maxCo2) * 100;
  const coopBarPercent = ((progress?.coopAverageCo2Kg ?? 0) / maxCo2) * 100;

  const energyAvoidedKwh = comparison?.comparisonAvailable
    ? Math.max(0, comparison.previousUsageKwh - comparison.currentUsageKwh)
    : null;

  const communityScore = computeCommunityScore(progress?.co2ToDateKg ?? 0, progress?.coopAverageCo2Kg ?? 0);
  const badgesCount = progress?.badges?.length ?? 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F6F4B" />}
      >
        <ScreenHeader
          eyebrow={view === "usage" ? "Welcome back" : "Sustainability"}
          title={view === "usage" ? (user?.name ? `${user.name}'s Home` : "Your Home") : "Your impact, at a glance"}
          subtitle={view === "sustainability" ? "Small changes add up across the co-op." : undefined}
        />

        <SegmentedToggle
          value={view}
          onChange={setView}
          options={[{ label: "Usage", value: "usage" }, { label: "Sustainability", value: "sustainability" }]}
        />

        {view === "usage" ? (
          <>
            <Card className="mb-6 bg-primary">
              <Text className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">This month's goal</Text>
              <Text className="text-3xl font-bold text-white mb-1">-{goal.targetPercentReduction}%</Text>
              <Text className="text-sm text-white/80 mb-4">Electricity reduction vs last month</Text>
              <ProgressBar percent={ringPercent} color="bg-sun" />
              <Text className="text-xs text-white/70 mt-2">
                {Math.round(ringPercent)}% complete • {daysLeftInMonth()} days left
              </Text>
            </Card>

            <Card className="mb-6 flex-row items-center">
              <Text className="text-2xl mr-3">🌳</Text>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">CO2 offset so far</Text>
                <Text className="text-xl font-bold text-ink">{progress?.co2ToDateKg ?? 0} kg</Text>
                <Text className="text-xs text-muted mt-1">≈ {progress?.treesEquivalent ?? 0} trees</Text>
              </View>
            </Card>

            <Card className="mb-6">
              <Text className="text-sm font-semibold text-ink mb-3">Co-op average vs your unit</Text>
              <View className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-muted">You</Text>
                  <Text className="text-xs font-semibold text-ink">{progress?.co2ToDateKg ?? 0} kg</Text>
                </View>
                <ProgressBar percent={youBarPercent} color="bg-primary" />
              </View>
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-muted">Co-op avg</Text>
                  <Text className="text-xs font-semibold text-ink">{progress?.coopAverageCo2Kg ?? 0} kg</Text>
                </View>
                <ProgressBar percent={coopBarPercent} color="bg-sun" />
              </View>
            </Card>

            {badgesCount > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-ink mb-2">Badges earned</Text>
                <View className="flex-row flex-wrap">
                  {progress.badges.map((b) => <BadgeChip key={b} label={b} />)}
                </View>
              </View>
            )}

            {(insight || tip) && (
              <Card className="mb-6 bg-primary-light border-primary/20">
                <Text className="text-sm font-semibold text-primary mb-1">✨ Your AI insight</Text>
                <Text className="text-sm text-ink leading-5">{insight || tip}</Text>
              </Card>
            )}

            <PrimaryButton label="View Sustainability Goals  →" onPress={() => navigation.navigate("Comparison")} />
          </>
          
        ) : (
          <>
            <Card className="mb-6 bg-primary flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">This month</Text>
                <Text className="text-3xl font-bold text-white mb-1">{thisMonthCo2} kg</Text>
                <Text className="text-sm text-white/80">CO2 avoided</Text>
                <Text className="text-xs text-white/60 mt-2">
                  Equivalent to ≈{progress?.treesEquivalent ?? 0} trees growing for a year
                </Text>
              </View>
              {comparison?.comparisonAvailable && (
                <View className="w-16 h-16 rounded-full bg-white/15 items-center justify-center ml-3">
                  <Text className="text-white text-xs font-bold">CO2</Text>
                  <Text className="text-sun text-xs font-bold">-{comparison.actualReductionPercent}%</Text>
                </View>
              )}
            </Card>

            <View className="flex-row mb-6">
              <Card className="flex-1 mr-2 items-center">
                <Text className="text-xs text-muted mb-2">Savings Goal</Text>
                <SunRing percent={ringPercent} size={90} strokeWidth={9} label={`${Math.round(ringPercent)}%`} />
                <Text className="text-xs text-muted mt-2">-{goal.targetPercentReduction}% target</Text>
                <Text className="text-xs text-muted">{daysLeftInMonth()} days</Text>
              </Card>
              <Card className="flex-1 ml-2 items-center justify-center">
                <Text className="text-xs text-muted mb-2">Co-op Impact</Text>
                <Text className="text-3xl font-bold text-primary">{communityScore}</Text>
                <Text className="text-xs text-muted mb-2">/100 Community score</Text>
                <ProgressBar percent={communityScore} color="bg-primary" />
              </Card>
            </View>

            <Text className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Your sustainability</Text>
            <Card className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm text-ink">Energy avoided vs last month</Text>
              <Text className="text-sm font-bold text-primary">
                {energyAvoidedKwh !== null ? `${energyAvoidedKwh} kWh` : "—"}
              </Text>
            </Card>
            <Card className="mb-6 flex-row items-center justify-between">
              <Text className="text-sm text-ink">Badges earned</Text>
              <Text className="text-sm font-bold text-primary">{badgesCount} / {TOTAL_POSSIBLE_BADGES}</Text>
            </Card>

            <PrimaryButton label="View Sustainability Goals  →" onPress={() => navigation.navigate("Comparison")} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}