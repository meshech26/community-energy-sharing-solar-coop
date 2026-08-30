import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TempLoginScreen from "../screens/TempLoginScreen";
import MainTabs from "./MainTabs";

const Stack = createNativeStackNavigator();

export default function SustainabilityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TempLogin" component={TempLoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}