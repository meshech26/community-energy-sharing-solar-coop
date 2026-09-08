import React from 'react';
import { View, Text } from 'react-native';
import { formatKW, formatKWh } from '../utils/formatEnergy';

/**
 * Solar Generation Card component.
 * Brand Aligned: Solar Share styling.
 */
export default function SolarGenerationCard({ solar }) {
  const { current, today, weekly, monthly } = solar || { current: 0, today: 0, weekly: 0, monthly: 0 };

  return (
    <View className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-amber-50 rounded-2xl justify-center items-center border border-amber-100">
            <Text className="text-xl">☀️</Text>
          </View>
          <View>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Solar Output
            </Text>
            <Text className="text-base font-extrabold text-[#1d2a23]">
              Solar Generation
            </Text>
          </View>
        </View>
        
        {/* Real-time Indicator Badge */}
        <View className="bg-[#eef4f0] px-3 py-1.5 rounded-full border border-[#dcece1]">
          <Text className="text-[10px] font-extrabold text-[#3b6e52]">LIVE</Text>
        </View>
      </View>

      {/* Main Grid */}
      <View className="flex-row justify-between items-center py-4 border-b border-slate-100">
        <View>
          <Text className="text-xs text-slate-400 font-semibold">Current Generation</Text>
          <Text className="text-3xl font-black text-[#1d2a23] mt-1">
            {formatKW(current)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-slate-400 font-semibold">Today Generated</Text>
          <Text className="text-3xl font-black text-[#3b6e52] mt-1">
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
