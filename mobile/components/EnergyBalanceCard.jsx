import React from 'react';
import { View, Text } from 'react-native';
import { formatKW } from '../utils/formatEnergy';

/**
 * Energy Balance Card component.
 * Brand Aligned: Solar Share styling.
 */
export default function EnergyBalanceCard({ balance }) {
  const { current, today } = balance || { current: 0, today: 0 };
  const isSurplus = current >= 0;
  const isTodaySurplus = today >= 0;

  return (
    <View 
      className={`rounded-[24px] border p-6 mb-4 shadow-sm ${
        isSurplus 
          ? 'bg-[#eef4f0] border-[#dcece1]' 
          : 'bg-rose-50 border-rose-100'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View 
            className={`w-10 h-10 rounded-2xl justify-center items-center border ${
              isSurplus ? 'bg-white border-[#dcece1]' : 'bg-white border-rose-100'
            }`}
          >
            <Text className="text-xl">
              {isSurplus ? '🔋' : '🔌'}
            </Text>
          </View>
          <View>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Net Flow
            </Text>
            <Text className="text-base font-extrabold text-[#1d2a23]">
              Energy Balance
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View 
          className={`px-3 py-1.5 rounded-full border ${
            isSurplus 
              ? 'bg-white border-[#dcece1]' 
              : 'bg-white border-rose-200'
          }`}
        >
          <Text className={`text-[10px] font-extrabold ${isSurplus ? 'text-[#3b6e52]' : 'text-rose-600'}`}>
            {isSurplus ? 'SURPLUS' : 'DEFICIT'}
          </Text>
        </View>
      </View>

      {/* Main Grid */}
      <View className="flex-row justify-between items-center py-4 border-b border-slate-200/40">
        <View>
          <Text className="text-xs text-slate-400 font-semibold">Current Flow</Text>
          <Text 
            className={`text-3xl font-black mt-1 ${
              isSurplus ? 'text-[#3b6e52]' : 'text-rose-600'
            }`}
          >
            {isSurplus ? '+' : ''}{formatKW(current)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-slate-400 font-semibold">Today's Net Flow</Text>
          <Text 
            className={`text-3xl font-black mt-1 ${
              isTodaySurplus ? 'text-[#3b6e52]' : 'text-rose-600'
            }`}
          >
            {isTodaySurplus ? '+' : ''}{today.toFixed(1)} kWh
          </Text>
        </View>
      </View>

      {/* Message description */}
      <Text className="text-xs text-slate-500 mt-4 leading-relaxed">
        {isSurplus 
          ? 'Your household is producing more solar energy than it is currently consuming. The excess power is shared with the local grid.' 
          : 'Your household is drawing more power than your solar panels are generating. You are drawing electricity from the co-op grid.'
        }
      </Text>
    </View>
  );
}
