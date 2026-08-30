import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ProgressScreen from "../screens/ProgressScreen";
import LogProgressScreen from "../screens/LogProgressScreen";
import ComparisonScreen from "../screens/ComparisonScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import SetGoalScreen from "../screens/SetGoalScreen";

const Tab = createBottomTabNavigator();

const ICONS = {
  Progress: "home",
  LogProgress: "add-circle",
  Comparison: "swap-horizontal",
  Leaderboard: "trophy",
  SetGoal: "settings",
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1F6F4B",
        tabBarInactiveTintColor: "#5B6B61",
        tabBarStyle: { borderTopColor: "#E4E1D6", height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: "Home" }} />
      <Tab.Screen name="LogProgress" component={LogProgressScreen} options={{ title: "Log" }} />
      <Tab.Screen name="Comparison" component={ComparisonScreen} options={{ title: "Compare" }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: "Co-op" }} />
      <Tab.Screen name="SetGoal" component={SetGoalScreen} options={{ title: "Goal" }} />
    </Tab.Navigator>
  );
}