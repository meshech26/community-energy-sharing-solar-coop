import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

/**
 * Reusable Loading screen spinner with glassmorphism style container
 */
export default function LoadingComponent({ message = 'Loading energy data...' }) {
  return (
    <View className="flex-1 justify-center items-center p-6 bg-slate-50 dark:bg-slate-900">
      <View className="p-8 bg-white/80 dark:bg-slate-800/80 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl items-center">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-200">
          {message}
        </Text>
      </View>
    </View>
  );
}
