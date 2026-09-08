import React from 'react';
import { View, Text } from 'react-native';

/**
 * Monthly Usage Card component.
 * Brand Aligned: Solar Share styling.
 */
export default function MonthlyUsageCard({ limitData }) {
  const { monthlyLimit, currentUsage, percentageUsed } = limitData || {
    monthlyLimit: 300,
    currentUsage: 0,
    percentageUsed: 0,
  };

  // Determine status and style color scheme based on usage percentage
  let statusText = 'Normal';
  let colorClass = 'text-[#3b6e52]';
  let bgBarClass = 'bg-[#3b6e52]';
  let bgTrackClass = 'bg-[#eef4f0]';

  if (percentageUsed >= 100) {
    statusText = 'Critical (Limit Exceeded)';
    colorClass = 'text-rose-600';
    bgBarClass = 'bg-rose-600';
    bgTrackClass = 'bg-rose-50';
  } else if (percentageUsed >= 90) {
    statusText = 'High Usage Warning';
    colorClass = 'text-orange-500';
    bgBarClass = 'bg-orange-500';
    bgTrackClass = 'bg-orange-50';
  } else if (percentageUsed >= 80) {
    statusText = 'Warning Threshold';
    colorClass = 'text-amber-500';
    bgBarClass = 'bg-amber-500';
    bgTrackClass = 'bg-amber-50';
  }

  // Cap bar width to 100% maximum
  const barWidth = Math.min(percentageUsed, 100);

  return (
    <View className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-2xl justify-center items-center">
            <Text className="text-xl">📅</Text>
          </View>
          <View>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Budget Status
            </Text>
            <Text className="text-base font-extrabold text-[#1d2a23]">
              Monthly Limit
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Stats */}
      <View className="mb-4">
        <View className="flex-row justify-between items-baseline mb-2">
          <View className="flex-row items-baseline gap-1">
            <Text className="text-3xl font-black text-[#1d2a23]">
              {Math.round(currentUsage)}
            </Text>
            <Text className="text-xs font-bold text-slate-400">
              / {monthlyLimit} kWh
            </Text>
          </View>
          <Text className={`text-2xl font-black ${colorClass}`}>
            {percentageUsed}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View className={`w-full h-4 rounded-full ${bgTrackClass} overflow-hidden`}>
          <View 
            className={`h-full rounded-full ${bgBarClass}`}
            style={{ width: `${barWidth}%` }}
          />
        </View>
      </View>

      {/* Status Footer */}
      <View className="flex-row justify-between items-center pt-2">
        <Text className="text-xs text-slate-400 font-semibold">
          Status Indicator
        </Text>
        <Text className={`text-xs font-extrabold uppercase ${colorClass}`}>
          {statusText}
        </Text>
      </View>
    </View>
  );
}
