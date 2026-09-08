import React from 'react';
import { View, Text } from 'react-native';

/**
 * Custom Responsive Energy Trend Bar Chart.
 * Brand Aligned: Solar Share styling.
 */
export default function EnergyChart({ historyData }) {
  const data = historyData && historyData.length > 0
    ? historyData.slice(-7)
    : [
        { formattedTime: 'Mon', solarGeneration: 0, energyConsumption: 0 },
        { formattedTime: 'Tue', solarGeneration: 0, energyConsumption: 0 },
        { formattedTime: 'Wed', solarGeneration: 0, energyConsumption: 0 },
        { formattedTime: 'Thu', solarGeneration: 0, energyConsumption: 0 },
        { formattedTime: 'Fri', solarGeneration: 0, energyConsumption: 0 },
        { formattedTime: 'Sat', solarGeneration: 0, energyConsumption: 0 },
        { formattedTime: 'Sun', solarGeneration: 0, energyConsumption: 0 },
      ];

  const maxVal = Math.max(
    ...data.map(d => Math.max(d.solarGeneration || 0, d.energyConsumption || 0)),
    5
  );

  const MAX_BAR_HEIGHT = 120;

  return (
    <View className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 mb-4">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-base font-extrabold text-[#1d2a23]">
          Energy Usage Trends
        </Text>
        <Text className="text-xs text-slate-400 font-semibold mt-0.5">
          Solar generation vs. consumption comparison (Last 7 intervals)
        </Text>
      </View>

      {/* Legend */}
      <View className="flex-row items-center gap-4 mb-6">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3.5 h-3.5 bg-[#3b6e52] rounded-md" />
          <Text className="text-xs font-bold text-slate-500">
            Solar Generation
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3.5 h-3.5 bg-blue-500 rounded-md" />
          <Text className="text-xs font-bold text-slate-500">
            Consumption
          </Text>
        </View>
      </View>

      {/* Chart Grid */}
      <View className="h-40 flex-row justify-between items-end border-b border-slate-100 pb-1.5 px-1">
        {data.map((item, idx) => {
          const solarHeight = ((item.solarGeneration || 0) / maxVal) * MAX_BAR_HEIGHT;
          const consHeight = ((item.energyConsumption || 0) / maxVal) * MAX_BAR_HEIGHT;

          return (
            <View key={idx} className="items-center flex-1 mx-1.5">
              <View className="flex-row items-end gap-1 justify-center h-full">
                {/* Solar Bar (Brand Green) */}
                <View 
                  className="w-2.5 bg-[#3b6e52] rounded-t-full"
                  style={{ height: Math.max(solarHeight, 3) }}
                />
                {/* Consumption Bar */}
                <View 
                  className="w-2.5 bg-blue-500 rounded-t-full"
                  style={{ height: Math.max(consHeight, 3) }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* X-Axis Labels */}
      <View className="flex-row justify-between pt-2 px-1">
        {data.map((item, idx) => (
          <Text 
            key={idx} 
            className="text-[10px] font-bold text-slate-400 text-center flex-1"
            numberOfLines={1}
          >
            {item.formattedTime}
          </Text>
        ))}
      </View>
    </View>
  );
}
