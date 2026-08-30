import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyImpactScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-4">
      <MaterialCommunityIcons name="chart-line" size={64} color="#0f6b4b" className="mb-4" />
      <Text className="text-2xl font-bold text-gray-900 mb-2">My Impact</Text>
      <Text className="text-gray-600 text-center">Track your environmental impact and carbon savings here.</Text>
    </SafeAreaView>
  );
}
