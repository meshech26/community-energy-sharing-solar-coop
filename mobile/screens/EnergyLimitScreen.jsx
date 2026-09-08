import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useEnergyStore } from '../store/energyStore';
import LoadingComponent from '../components/LoadingComponent';

/**
 * Configure Monthly Energy Limit Screen.
 * Brand Aligned: Solar Share Green Theme.
 */
export default function EnergyLimitScreen({ navigation }) {
  const { energyLimit, loading, error, fetchEnergyLimit, updateEnergyLimit, clearError } = useEnergyStore();

  const [limitInput, setLimitInput] = useState('');
  const [warningInput, setWarningInput] = useState('80');
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchEnergyLimit();
    clearError();
  }, []);

  useEffect(() => {
    if (energyLimit) {
      setLimitInput(energyLimit.monthlyLimit.toString());
      setWarningInput((energyLimit.warningPercentage || 80).toString());
    }
  }, [energyLimit]);

  const handleSave = async () => {
    setValidationError('');
    setSuccessMsg('');
    clearError();

    if (!limitInput.trim()) {
      setValidationError('Monthly limit cannot be empty.');
      return;
    }

    const limitNum = Number(limitInput);
    if (isNaN(limitNum)) {
      setValidationError('Monthly limit must be a valid number.');
      return;
    }

    if (limitNum <= 0) {
      setValidationError('Monthly limit must be greater than zero.');
      return;
    }

    const warningNum = Number(warningInput);
    if (isNaN(warningNum) || warningNum < 1 || warningNum > 100) {
      setValidationError('Warning threshold must be a number between 1% and 100%.');
      return;
    }

    const result = await updateEnergyLimit(limitNum, warningNum);
    if (result.success) {
      setSuccessMsg('Energy limits updated successfully!');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } else {
      setValidationError(result.error || 'Failed to save configuration.');
    }
  };

  if (loading && !energyLimit) {
    return <LoadingComponent message="Loading configuration limits..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#f4f6f5]"
    >
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Title with Back Button */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white border border-slate-200 rounded-full justify-center items-center mr-3 shadow-sm active:bg-slate-100"
          >
            <Text className="text-lg font-bold text-slate-700">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-extrabold text-[#1d2a23]">
              Configure Limit
            </Text>
            <Text className="text-xs text-slate-400 font-semibold mt-0.5">
              Set consumption budgets for your household
            </Text>
          </View>
        </View>

        {/* Current Config Info Box */}
        {energyLimit && (
          <View className="bg-[#eef4f0] border border-[#dcece1] rounded-3xl p-5 mb-6">
            <Text className="text-xs font-extrabold text-[#3b6e52] uppercase tracking-wider mb-2">
              Active Parameters
            </Text>
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-sm text-slate-500">Monthly limit:</Text>
              <Text className="text-sm font-bold text-[#1d2a23]">{energyLimit.monthlyLimit} kWh</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-500">Warning percentage:</Text>
              <Text className="text-sm font-bold text-[#1d2a23]">{energyLimit.warningPercentage}%</Text>
            </View>
          </View>
        )}

        {/* Form Fields */}
        <View className="space-y-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          {/* Input: Monthly Limit */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
              Monthly Limit (kWh)
            </Text>
            <TextInput
              value={limitInput}
              onChangeText={(text) => {
                setLimitInput(text);
                setValidationError('');
              }}
              placeholder="e.g. 300"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-[#1d2a23] focus:border-[#3b6e52]"
              style={{ fontSize: 16 }}
            />
          </View>

          {/* Input: Warning Percentage */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
              Warning Threshold (%)
            </Text>
            <TextInput
              value={warningInput}
              onChangeText={(text) => {
                setWarningInput(text);
                setValidationError('');
              }}
              placeholder="e.g. 80"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-[#1d2a23] focus:border-[#3b6e52]"
              style={{ fontSize: 16 }}
            />
            <Text className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              We will send warnings and push alerts when your household usage crosses this percentage of your monthly limit.
            </Text>
          </View>
        </View>

        {/* Validation Error Banner */}
        {(validationError || error) && (
          <View className="mt-5 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex-row items-center gap-3">
            <Text className="text-lg">❌</Text>
            <Text className="text-xs font-bold text-rose-600 flex-1 leading-relaxed">
              {validationError || error}
            </Text>
          </View>
        )}

        {/* Success Banner */}
        {successMsg && (
          <View className="mt-5 bg-[#eef4f0] border border-[#dcece1] rounded-2xl p-4 flex-row items-center gap-3">
            <Text className="text-lg">✅</Text>
            <Text className="text-xs font-bold text-[#3b6e52] flex-1 leading-relaxed">
              {successMsg}
            </Text>
          </View>
        )}

        {/* Submit Actions */}
        <TouchableOpacity
          onPress={handleSave}
          className="mt-6 py-4 bg-[#3b6e52] rounded-2xl shadow-lg shadow-[#3b6e52]/30 items-center active:bg-[#345e46]"
        >
          <Text className="text-base font-bold text-white">Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-3 py-4 bg-white border border-slate-200 rounded-2xl items-center active:bg-slate-50"
        >
          <Text className="text-sm font-bold text-slate-500">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
