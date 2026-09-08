import React from 'react';
import { View, Text } from 'react-native';
import { formatKW, formatKWh } from '../utils/formatEnergy';

/**
 * Consumption Card component.
 * Brand Aligned: Solar Share styling.
 */
export default function ConsumptionCard({ consumption }) {
  const { current, today, weekly, monthly } = consumption || { current: 0, today: 0, weekly: 0, monthly: 0 };

  return (
    <View className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-blue-50 rounded-2xl justify-center items-center border border-blue-100">
            <Text className="text-xl">⚡</Text>
          </View>
          <View>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Household Use
            </Text>
            <Text className="text-base font-extrabold text-[#1d2a23]">
              Energy Consumption
            </Text>
          </View>
        </View>

        {/* Real-time Indicator Badge */}
        <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
          <Text className="text-[10px] font-extrabold text-blue-600">LIVE</Text>
        </View>
      </View>

      {/* Main Grid */}
      <View className="flex-row justify-between items-center py-4 border-b border-slate-100">
        <View>
          <Text className="text-xs text-slate-400 font-semibold">Current Consumption</Text>
          <Text className="text-3xl font-black text-[#1d2a23] mt-1">
            {formatKW(current)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-slate-400 font-semibold">Today Consumed</Text>
          <Text className="text-3xl font-black text-blue-600 mt-1">
            {formatKWh(today)}
          </Text>
        </View>
      </View>

      {/* Aggregate Stats Footer */}
      <View className="flex-row justify-between pt-4">
        <View className="flex-1 border-r border-slate-100 pr-2">
          <Text className="text-xs text-slate-400 font-semibold">This Week</Text>
          <Text className="text-sm font-extrabold text-slate-700 mt-0.5">
            {formatKWh(weekly)}
          </Text>
        </View>
        <View className="flex-1 pl-4">
          <Text className="text-xs text-slate-400 font-semibold">This Month</Text>
          <Text className="text-sm font-extrabold text-slate-700 mt-0.5">
            {formatKWh(monthly)}
          </Text>
        </View>
      </View>
    </View>
  );
}
