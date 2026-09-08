import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useEnergyStore } from '../store/energyStore';

/**
 * Financial Savings & Tariff Calculator Card
 * Formatted in Sri Lankan Rupees (LKR).
 * Reads custom user tariff rates and recorded physical utility bill from the Settings store.
 */
export default function FinancialSavingsCard({ solar, consumption, navigation }) {
  const monthlySolar = solar?.monthly || 0;
  const monthlyCons = consumption?.monthly || 0;

  const { tariffSettings } = useEnergyStore();
  const GRID_RATE = tariffSettings?.gridRate || 42.0; // LKR per kWh
  const COOP_FEED_IN_RATE = tariffSettings?.feedInRate || 35.0; // LKR per kWh
  const actualBill = tariffSettings?.actualBill ?? null;

  // Calculations based on dynamic user tariff
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

  // Format numbers with commas (e.g., LKR 12,450.00)
  const formatLKR = (num) => {
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Compare actual physical bill vs calculated net estimate
  const billDiff = actualBill !== null ? actualBill - netBill : 0;
  const accuracyPct = actualBill !== null && actualBill > 0
    ? Math.max(0, Math.min(100, Math.round((1 - Math.abs(billDiff) / actualBill) * 100)))
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
              Savings & Tariffs (LKR)
            </Text>
          </View>
        </View>

        {/* Dynamic Tariff Rate Badge */}
        <TouchableOpacity 
          onPress={() => navigation?.navigate('EnergyLimit')}
          className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 active:bg-slate-100"
        >
          <Text className="text-[10px] font-extrabold text-slate-600">
            LKR {GRID_RATE.toFixed(1)} / kWh ⚙️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Primary Financial Grid */}
      <View className="flex-row justify-between py-3 border-b border-slate-100">
        {/* Metric 1: Monthly Solar Savings */}
        <View className="flex-1 pr-2">
          <Text className="text-xs text-slate-400 font-semibold">Solar Savings</Text>
          <Text className="text-xl font-black text-[#3b6e52] mt-1">
            +LKR {formatLKR(solarSavings)}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            This month
          </Text>
        </View>

        {/* Metric 2: Estimated Net Bill */}
        <View className="flex-1 px-2 border-x border-slate-100 items-center">
          <Text className="text-xs text-slate-400 font-semibold">Net Estimate</Text>
          <Text className="text-xl font-black text-[#1d2a23] mt-1">
            LKR {formatLKR(netBill)}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            After solar offset
          </Text>
        </View>

        {/* Metric 3: Annual Projection */}
        <View className="flex-1 pl-2 items-end">
          <Text className="text-xs text-slate-400 font-semibold">Annual Savings</Text>
          <Text className="text-xl font-black text-blue-600 mt-1">
            LKR {formatLKR(annualProjectedSavings)}
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
              🎉 You have accumulated <Text className="text-[#3b6e52] font-black">LKR {formatLKR(coopCredits)}</Text> in Community Co-op feed-in sharing credits!
            </Text>
          )}
        </View>
      </View>

      {/* Physical Utility Bill Verification Section */}
      <View className="mt-4 pt-4 border-t border-slate-100">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-xs font-bold text-[#1d2a23]">
              Actual Physical Bill (CEB / LECO)
            </Text>
            <Text className="text-[10px] text-slate-400">
              Verify metering accuracy with your physical statement
            </Text>
          </View>
          {navigation && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('EnergyLimit')}
              className="px-2.5 py-1 bg-slate-100 rounded-lg active:bg-slate-200"
            >
              <Text className="text-[10px] font-bold text-slate-600">Settings ⚙️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* When bill is NOT entered -> Prompts to add in Settings */}
        {actualBill === null && (
          <TouchableOpacity
            onPress={() => navigation?.navigate('EnergyLimit')}
            className="py-3 px-4 bg-white border border-dashed border-[#3b6e52]/50 rounded-2xl items-center active:bg-[#eef4f0]"
          >
            <Text className="text-xs font-bold text-[#3b6e52]">
              + Record Actual Bill & Adjust Rates in Settings
            </Text>
          </TouchableOpacity>
        )}

        {/* When actual bill IS entered -> Comparison Summary */}
        {actualBill !== null && (
          <View className="bg-[#eef4f0] border border-[#dcece1] rounded-2xl p-4 mt-2">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-xs text-slate-600">Actual Utility Bill:</Text>
              <Text className="text-sm font-extrabold text-[#1d2a23]">
                LKR {formatLKR(actualBill)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-xs text-slate-600">Co-op Net Estimate:</Text>
              <Text className="text-sm font-extrabold text-[#3b6e52]">
                LKR {formatLKR(netBill)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center pt-2 border-t border-[#dcece1]">
              <Text className="text-[11px] font-bold text-slate-500">
                Variance: LKR {formatLKR(Math.abs(billDiff))}
              </Text>
              <View className="bg-white px-2 py-0.5 rounded-full border border-[#dcece1]">
                <Text className="text-[10px] font-extrabold text-[#3b6e52]">
                  {accuracyPct}% Accuracy
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
