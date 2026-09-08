import React from 'react';
import { View, Text } from 'react-native';

/**
 * Financial Savings & Tariff Calculator Card
 * Translates solar generation and consumption into financial metrics and utility bill offsets.
 * 
 * Tariff Constants (Standard Co-op Electricity Tariffs):
 * - Standard Grid Utility Rate: $0.16 per kWh
 * - Co-op Solar Feed-in Credit: $0.12 per kWh for community sharing
 */
export default function FinancialSavingsCard({ solar, consumption }) {
  const monthlySolar = solar?.monthly || 0;
  const monthlyCons = consumption?.monthly || 0;

  const GRID_RATE = 0.16; // $0.16 / kWh
  const COOP_FEED_IN_RATE = 0.12; // $0.12 / kWh

  // Calculations
  const grossCost = monthlyCons * GRID_RATE;
  const solarSavings = monthlySolar * GRID_RATE;
  const netBill = Math.max(0, grossCost - solarSavings);
  const coopCredits = monthlySolar > monthlyCons 
    ? ((monthlySolar - monthlyCons) * COOP_FEED_IN_RATE).toFixed(2)
    : 0;

  const annualProjectedSavings = (solarSavings * 12).toFixed(2);
  const billReductionPct = grossCost > 0 
    ? Math.min(100, Math.round((solarSavings / grossCost) * 100))
    : 100;

  return (
    <View className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-[#eef4f0] rounded-2xl justify-center items-center border border-[#dcece1]">
            <Text className="text-xl">💰</Text>
          </View>
          <View>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Financial Estimates
            </Text>
            <Text className="text-base font-extrabold text-[#1d2a23]">
              Savings & Tariffs
            </Text>
          </View>
        </View>

        {/* Tariff Rate Badge */}
        <View className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <Text className="text-[10px] font-extrabold text-slate-600">
            $0.16 / kWh
          </Text>
        </View>
      </View>

      {/* Primary Financial Grid */}
      <View className="flex-row justify-between py-3 border-b border-slate-100">
        {/* Metric 1: Monthly Solar Savings */}
        <View className="flex-1 pr-2">
          <Text className="text-xs text-slate-400 font-semibold">Solar Savings</Text>
          <Text className="text-2xl font-black text-[#3b6e52] mt-1">
            +${solarSavings.toFixed(2)}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            This month
          </Text>
        </View>

        {/* Metric 2: Estimated Net Bill */}
        <View className="flex-1 px-2 border-x border-slate-100 items-center">
          <Text className="text-xs text-slate-400 font-semibold">Net Bill</Text>
          <Text className="text-2xl font-black text-[#1d2a23] mt-1">
            ${netBill.toFixed(2)}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            After solar offset
          </Text>
        </View>

        {/* Metric 3: Annual Projection */}
        <View className="flex-1 pl-2 items-end">
          <Text className="text-xs text-slate-400 font-semibold">Annual Savings</Text>
          <Text className="text-2xl font-black text-blue-600 mt-1">
            ${annualProjectedSavings}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            12-mo projected
          </Text>
        </View>
      </View>

      {/* Bill Reduction & Credits Banner */}
      <View className="mt-4 bg-[#f4f6f5] rounded-2xl p-3.5 border border-slate-100 flex-row items-center gap-2.5">
        <Text className="text-base">📉</Text>
        <View className="flex-1">
          <Text className="text-xs text-slate-600 leading-relaxed">
            Clean solar power has reduced your estimated utility bill by{' '}
            <Text className="font-extrabold text-[#3b6e52]">{billReductionPct}%</Text> this month.
          </Text>
          {Number(coopCredits) > 0 && (
            <Text className="text-[11px] font-bold text-slate-500 mt-1">
              🎉 You have accumulated <Text className="text-[#3b6e52] font-black">${coopCredits}</Text> in Community Co-op feed-in sharing credits!
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
