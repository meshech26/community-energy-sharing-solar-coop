import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Switch, ActivityIndicator } from "react-native";
import { useSustainabilityStore } from "../store/sustainabilityStore";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";

export default function LeaderboardScreen() {
  const { goal, leaderboard, loadLeaderboard, toggleLeaderboardOptIn, loading } = useSustainabilityStore();
  const [optIn, setOptIn] = useState(goal?.leaderboardOptIn ?? false);

  useEffect(() => { loadLeaderboard(); }, []);
  useEffect(() => { if (goal) setOptIn(goal.leaderboardOptIn); }, [goal]);

  const handleToggle = async (value) => {
    setOptIn(value);
    await toggleLeaderboardOptIn(value);
    loadLeaderboard();
  };

  return (
    <View className="flex-1 bg-surface px-6 pt-16">
      <ScreenHeader eyebrow="Community" title="Co-op leaderboard" />

      <Card className="flex-row items-center justify-between mb-6">
        <Text className="text-sm text-ink flex-1 mr-4">Show my progress on the community leaderboard</Text>
        <Switch value={optIn} onValueChange={handleToggle} trackColor={{ true: "#1F6F4B" }} />
      </Card>

      {loading && leaderboard.length === 0 ? (
        <ActivityIndicator size="large" color="#1F6F4B" />
      ) : leaderboard.length === 0 ? (
        <Text className="text-muted text-center mt-10">No opted-in households yet.</Text>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => String(item.rank)}
          renderItem={({ item }) => (
            <Card className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center mr-3">
                  <Text className="text-primary font-bold text-xs">#{item.rank}</Text>
                </View>
                <Text className="text-ink font-medium">{item.name}</Text>
              </View>
              <Text className="text-primary font-bold">{item.co2ToDateKg} kg</Text>
            </Card>
          )}
        />
      )}
    </View>
  );
}