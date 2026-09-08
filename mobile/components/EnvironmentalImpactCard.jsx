import React from 'react';
import { View, Text } from 'react-native';

/**
 * Environmental & Carbon Impact Tracker Card
 * Translates solar generation (kWh) into real-world environmental sustainability metrics.
 * 
 * Formulas (Standard EPA Clean Energy Equivalencies):
 * - 1 kWh clean solar ~= 0.40 kg CO2 emissions offset
 * - 1 mature tree absorbs ~= 20 kg CO2 annually
 * - 1 km of typical passenger vehicle driving ~= 0.20 kg CO2 emissions
 */
export default function EnvironmentalImpactCard({ solar }) {
  const monthlySolar = solar?.monthly || 0;
  const todaySolar = solar?.today || 0;

  // Calculate environmental impacts
  const co2SavedMonthly = (monthlySolar * 0.4).toFixed(1);
  const co2SavedToday = (todaySolar * 0.4).toFixed(1);
  const treesEquivalent = Math.max(0, (monthlySolar * 0.4 / 20)).toFixed(1);
  const carKmOffset = Math.round(monthlySolar * 0.4 * 5); // 1 kg CO2 ~= 5 km

  // Determine Eco-Tier Badge based on monthly output
  let ecoTier = 'Clean Starter 🌱';
  let tierColor = 'text-[#3b6e52]';
  let tierBg = 'bg-[#eef4f0] border-[#dcece1]';

  if (monthlySolar >= 300) {
    ecoTier = 'Eco Pioneer 🌟';
    tierColor = 'text-amber-700';
    tierBg = 'bg-amber-50 border-amber-200';
  } else if (monthlySolar >= 100) {
    ecoTier = 'Green Champion 🌿';
    tierColor = 'text-[#3b6e52]';
    tierBg = 'bg-[#eef4f0] border-[#dcece1]';
  }

  return (
    <View className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-[#eef4f0] rounded-2xl justify-center items-center border border-[#dcece1]">
            <Text className="text-xl">🌱</Text>
          </View>
          <View>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Sustainability
            </Text>
            <Text className="text-base font-extrabold text-[#1d2a23]">
              Green Impact Tracker
            </Text>
          </View>
        </View>

        {/* Eco-Tier Badge */}
        <View className={`px-3 py-1.5 rounded-full border ${tierBg}`}>
          <Text className={`text-[10px] font-extrabold uppercase ${tierColor}`}>
            {ecoTier}
          </Text>
        </View>
      </View>

      {/* Primary Impact Grid */}
      <View className="flex-row justify-between py-3 border-b border-slate-100">
        {/* Metric 1: CO2 Avoided */}
        <View className="flex-1 pr-2">
          <Text className="text-xs text-slate-400 font-semibold">CO₂ Avoided</Text>
          <Text className="text-2xl font-black text-[#3b6e52] mt-1">
            {co2SavedMonthly} <Text className="text-xs font-bold text-slate-500">kg</Text>
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            +{co2SavedToday} kg today
          </Text>
        </View>

        {/* Metric 2: Trees Equivalent */}
        <View className="flex-1 px-2 border-x border-slate-100 items-center">
          <Text className="text-xs text-slate-400 font-semibold">Trees Saved</Text>
          <Text className="text-2xl font-black text-[#1d2a23] mt-1">
            🌳 {treesEquivalent}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            Annual equiv.
          </Text>
        </View>

        {/* Metric 3: Car Driving Offset */}
        <View className="flex-1 pl-2 items-end">
          <Text className="text-xs text-slate-400 font-semibold">Driving Offset</Text>
          <Text className="text-2xl font-black text-blue-600 mt-1">
            {carKmOffset} <Text className="text-xs font-bold text-slate-500">km</Text>
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            Fuel emissions
          </Text>
        </View>
      </View>

      {/* Community Summary Banner */}
      <View className="mt-4 bg-[#f4f6f5] rounded-2xl p-3.5 flex-row items-center gap-2.5 border border-slate-100">
        <Text className="text-base">🌍</Text>
        <Text className="text-xs text-slate-600 flex-1 leading-relaxed">
          Your clean solar production has kept <Text className="font-bold text-[#1d2a23]">{co2SavedMonthly} kg of greenhouse gases</Text> out of the atmosphere this month!
        </Text>
      </View>
    </View>
  );
}
