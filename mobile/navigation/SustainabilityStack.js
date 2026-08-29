import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TempLoginScreen from "../screens/TempLoginScreen";
import ProgressScreen from "../screens/ProgressScreen";
import SetGoalScreen from "../screens/SetGoalScreen";
import LogProgressScreen from "../screens/LogProgressScreen";
import ComparisonScreen from "../screens/ComparisonScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";

const Stack = createNativeStackNavigator();

export default function SustainabilityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TempLogin" component={TempLoginScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="SetGoal" component={SetGoalScreen} />
      <Stack.Screen name="LogProgress" component={LogProgressScreen} />
      <Stack.Screen name="Comparison" component={ComparisonScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Stack.Navigator>
  );
}