import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';

/**
 * Financial Savings & Tariff Calculator Card
 * Formatted in Sri Lankan Rupees (LKR).
 * Allows manual recording and comparison of physical utility bills.
 * 
 * Standard Sri Lankan Domestic Electricity Tariffs (CEB/LECO Reference):
 * - Grid Electricity Tariff: LKR 42.00 per kWh
 * - Solar Co-op Feed-in Tariff: LKR 35.00 per kWh
 */
export default function FinancialSavingsCard({ solar, consumption }) {
  const monthlySolar = solar?.monthly || 0;
  const monthlyCons = consumption?.monthly || 0;

  const GRID_RATE = 42.0; // LKR 42.00 / kWh
  const COOP_FEED_IN_RATE = 35.0; // LKR 35.00 / kWh

  // Manual Actual Bill State
  const [actualBill, setActualBill] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState('');

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

  // Format numbers with commas (e.g., LKR 12,450.00)
  const formatLKR = (num) => {
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSaveActualBill = () => {
    setInputError('');
    const parsed = parseFloat(inputVal);
    if (isNaN(parsed) || parsed < 0) {
      setInputError('Please enter a valid bill amount in LKR.');
      return;
    }
    setActualBill(parsed);
    setIsEditing(false);
  };

  const handleClearActualBill = () => {
    setActualBill(null);
    setInputVal('');
    setIsEditing(false);
  };

  // Compare actual bill vs calculated estimate
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

        {/* Tariff Rate Badge */}
        <View className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <Text className="text-[10px] font-extrabold text-slate-600">
            LKR 42 / kWh
          </Text>
        </View>
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

      {/* Manual Actual Bill Comparison Section */}
      <View className="mt-4 pt-4 border-t border-slate-100">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-xs font-bold text-[#1d2a23]">
              Actual Power Utility Bill (CEB / LECO)
            </Text>
            <Text className="text-[10px] text-slate-400">
              Record physical utility bill to verify co-op metering accuracy
            </Text>
          </View>
          {actualBill !== null && !isEditing && (
            <TouchableOpacity 
              onPress={() => {
                setInputVal(actualBill.toString());
                setIsEditing(true);
              }}
              className="px-2.5 py-1 bg-slate-100 rounded-lg active:bg-slate-200"
            >
              <Text className="text-[10px] font-bold text-slate-600">Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* When bill is NOT entered and not editing */}
        {actualBill === null && !isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            className="py-3 px-4 bg-white border border-dashed border-[#3b6e52]/50 rounded-2xl items-center active:bg-[#eef4f0]"
          >
            <Text className="text-xs font-bold text-[#3b6e52]">
              + Enter Actual Physical Bill (LKR)
            </Text>
          </TouchableOpacity>
        )}

        {/* When entering / editing actual bill */}
        {isEditing && (
          <View className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <Text className="text-xs font-semibold text-slate-500 mb-1.5">
              Enter Net Amount from Physical Bill (LKR):
            </Text>
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={inputVal}
                onChangeText={(val) => {
                  setInputVal(val);
                  setInputError('');
                }}
                placeholder="e.g. 4500.00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#1d2a23]"
                style={{ fontSize: 16 }}
              />
              <TouchableOpacity
                onPress={handleSaveActualBill}
                className="px-4 py-2.5 bg-[#3b6e52] rounded-xl active:bg-[#345e46]"
              >
                <Text className="text-xs font-bold text-white">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="px-3 py-2.5 bg-slate-200 rounded-xl active:bg-slate-300"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
            </View>
            {inputError ? (
              <Text className="text-[11px] font-bold text-rose-500 mt-1.5">
                {inputError}
              </Text>
            ) : null}
          </View>
        )}

        {/* When actual bill IS entered -> Comparison Summary */}
        {actualBill !== null && !isEditing && (
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
