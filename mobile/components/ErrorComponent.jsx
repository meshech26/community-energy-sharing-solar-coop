import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Reusable Error message display with retry trigger
 */
export default function ErrorComponent({ error, onRetry }) {
  return (
    <View className="flex-1 justify-center items-center p-6 bg-slate-50 dark:bg-slate-900">
      <View className="w-full max-w-sm p-6 bg-white dark:bg-slate-800 rounded-3xl border border-red-100 dark:border-red-950 shadow-xl items-center">
        {/* Warning Icon */}
        <View className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full justify-center items-center mb-4">
          <Text className="text-3xl text-red-600">⚠️</Text>
        </View>

        <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center">
          Connection Error
        </Text>

        <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          {error || 'Unable to connect to the energy server. Please try again later.'}
        </Text>

        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="w-full py-3.5 bg-green-600 rounded-2xl shadow-lg shadow-green-600/30 items-center active:bg-green-700"
          >
            <Text className="text-base font-bold text-white">Retry Connection</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
