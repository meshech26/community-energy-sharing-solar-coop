import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Switch, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const { goal, leaderboard, loadLeaderboard, toggleLeaderboardOptIn, loading } = useSustainabilityStore();
  const [optIn, setOptIn] = useState(goal?.leaderboardOptIn ?? false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadLeaderboard(); }, []);
  useEffect(() => { if (goal) setOptIn(goal.leaderboardOptIn); }, [goal]);

  const handleToggle = async (value) => {
    setOptIn(value);
    await toggleLeaderboardOptIn(value);
    loadLeaderboard();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  }, []);

  const myEntry = leaderboard.find((item) => item.name === user?.name);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface px-6">
      <ScreenHeader eyebrow="Community" title="Co-op leaderboard" subtitle="See how your household compares to the rest of the co-op." />

      {optIn && (
        <Card className="mb-6 bg-primary">
          <Text className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Your rank</Text>
          <Text className="text-3xl font-bold text-white">
            {myEntry ? `#${myEntry.rank}` : "Unranked yet"}
          </Text>
          {myEntry && <Text className="text-sm text-white/80 mt-1">{myEntry.co2ToDateKg} kg CO2 offset</Text>}
        </Card>
      )}

      <Card className="flex-row items-center justify-between mb-6">
        <Text className="text-sm text-ink flex-1 mr-4">Show my progress on the community leaderboard</Text>
        <Switch value={optIn} onValueChange={handleToggle} trackColor={{ true: "#1F6F4B" }} />
      </Card>

      {loading && leaderboard.length === 0 ? (
        <ActivityIndicator size="large" color="#1F6F4B" />
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => String(item.rank)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F6F4B" />}
          ListEmptyComponent={<Text className="text-muted text-center mt-10">No opted-in households yet.</Text>}
          renderItem={({ item }) => {
            const isMe = item.name === user?.name;
            return (
              <Card className={`flex-row items-center justify-between mb-3 ${isMe ? "border-primary" : ""}`}>
                <View className="flex-row items-center">
                  <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isMe ? "bg-primary" : "bg-primary-light"}`}>
                    <Text className={`font-bold text-xs ${isMe ? "text-white" : "text-primary"}`}>#{item.rank}</Text>
                  </View>
                  <Text className="text-ink font-medium">{item.name}{isMe ? " (You)" : ""}</Text>
                </View>
                <Text className="text-primary font-bold">{item.co2ToDateKg} kg</Text>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}