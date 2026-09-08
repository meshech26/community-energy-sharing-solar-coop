import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useEnergyStore } from '../store/energyStore';
import LoadingComponent from '../components/LoadingComponent';

/**
 * Energy & Tariff Settings Screen.
 * Configures monthly consumption limits, custom electricity tariff rates (LKR),
 * and records physical utility bills for metering verification.
 */
export default function EnergyLimitScreen({ navigation }) {
  const { 
    energyLimit, 
    tariffSettings, 
    loading, 
    error, 
    fetchEnergyLimit, 
    updateEnergyLimit, 
    updateTariffSettings, 
    clearError 
  } = useEnergyStore();

  // Limit States
  const [limitInput, setLimitInput] = useState('300');
  const [warningInput, setWarningInput] = useState('80');

  // Tariff States (LKR)
  const [gridRateInput, setGridRateInput] = useState('42.0');
  const [feedInRateInput, setFeedInRateInput] = useState('35.0');

  // Actual Physical Bill State (LKR)
  const [actualBillInput, setActualBillInput] = useState('');

  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchEnergyLimit();
    clearError();
  }, []);

  useEffect(() => {
    if (energyLimit) {
      setLimitInput(energyLimit.monthlyLimit ? energyLimit.monthlyLimit.toString() : '300');
      setWarningInput(energyLimit.warningPercentage ? energyLimit.warningPercentage.toString() : '80');
    }
    if (tariffSettings) {
      setGridRateInput(tariffSettings.gridRate ? tariffSettings.gridRate.toString() : '42.0');
      setFeedInRateInput(tariffSettings.feedInRate ? tariffSettings.feedInRate.toString() : '35.0');
      setActualBillInput(tariffSettings.actualBill !== null && tariffSettings.actualBill !== undefined ? tariffSettings.actualBill.toString() : '');
    }
  }, [energyLimit, tariffSettings]);

  const handleSave = async () => {
    setValidationError('');
    setSuccessMsg('');
    clearError();

    // 1. Validate Monthly Limit
    const limitNum = Number(limitInput);
    if (isNaN(limitNum) || limitNum <= 0) {
      setValidationError('Monthly limit must be a valid number greater than 0.');
      return;
    }

    // 2. Validate Warning Threshold
    const warningNum = Number(warningInput);
    if (isNaN(warningNum) || warningNum < 1 || warningNum > 100) {
      setValidationError('Warning threshold must be a percentage between 1% and 100%.');
      return;
    }

    // 3. Validate Tariff Rates
    const gridRateNum = Number(gridRateInput);
    if (isNaN(gridRateNum) || gridRateNum <= 0) {
      setValidationError('Grid electricity tariff rate must be a valid number greater than 0.');
      return;
    }

    const feedInRateNum = Number(feedInRateInput);
    if (isNaN(feedInRateNum) || feedInRateNum < 0) {
      setValidationError('Co-op feed-in rate must be a valid number.');
      return;
    }

    // 4. Validate Actual Bill (optional)
    let parsedActualBill = null;
    if (actualBillInput.trim()) {
      parsedActualBill = Number(actualBillInput.trim());
      if (isNaN(parsedActualBill) || parsedActualBill < 0) {
        setValidationError('Physical utility bill must be a valid positive amount.');
        return;
      }
    }

    // Save Backend Limit
    const limitResult = await updateEnergyLimit(limitNum, warningNum);
    if (!limitResult.success) {
      setValidationError(limitResult.error || 'Failed to save limits configuration.');
      return;
    }

    // Save Tariff & Actual Bill in Store
    updateTariffSettings({
      gridRate: gridRateNum,
      feedInRate: feedInRateNum,
      actualBill: parsedActualBill,
    });

    setSuccessMsg('Settings and tariff parameters updated successfully!');
    setTimeout(() => {
      navigation.goBack();
    }, 1200);
  };

  const handleClearActualBill = () => {
    setActualBillInput('');
  };

  if (loading && !energyLimit) {
    return <LoadingComponent message="Loading settings..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#f4f6f5]"
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
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
              Settings & Limits
            </Text>
            <Text className="text-xs text-slate-400 font-semibold mt-0.5">
              Configure energy budgets, custom tariffs, and utility bills
            </Text>
          </View>
        </View>

        {/* SECTION 1: Monthly Consumption Limits */}
        <View className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-5">
          <View className="flex-row items-center gap-2.5 mb-4">
            <Text className="text-lg">📊</Text>
            <Text className="text-sm font-extrabold text-[#1d2a23] uppercase tracking-wider">
              Monthly Consumption Budget
            </Text>
          </View>

          {/* Monthly Limit (kWh) */}
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

          {/* Warning Threshold (%) */}
          <View>
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
              Triggers push warnings when your monthly consumption crosses this percentage of your budget.
            </Text>
          </View>
        </View>

        {/* SECTION 2: Custom Electricity Tariff Rates (LKR) */}
        <View className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-5">
          <View className="flex-row items-center gap-2.5 mb-4">
            <Text className="text-lg">⚡</Text>
            <Text className="text-sm font-extrabold text-[#1d2a23] uppercase tracking-wider">
              Electricity Tariff Rates (LKR)
            </Text>
          </View>

          {/* Grid Rate */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
              Standard Grid Rate (LKR / kWh)
            </Text>
            <TextInput
              value={gridRateInput}
              onChangeText={(text) => {
                setGridRateInput(text);
                setValidationError('');
              }}
              placeholder="42.00"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-[#1d2a23] focus:border-[#3b6e52]"
              style={{ fontSize: 16 }}
            />
            <Text className="text-[10px] text-slate-400 mt-1">
              Your utility provider's cost per unit (e.g., CEB / LECO tariff).
            </Text>
          </View>

          {/* Feed-in Rate */}
          <View>
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
              Co-op Solar Feed-in Credit (LKR / kWh)
            </Text>
            <TextInput
              value={feedInRateInput}
              onChangeText={(text) => {
                setFeedInRateInput(text);
                setValidationError('');
              }}
              placeholder="35.00"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-[#1d2a23] focus:border-[#3b6e52]"
              style={{ fontSize: 16 }}
            />
            <Text className="text-[10px] text-slate-400 mt-1">
              Credit earned for exporting surplus solar electricity to the community co-op.
            </Text>
          </View>
        </View>

        {/* SECTION 3: Physical Utility Bill Verification (LKR) */}
        <View className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2.5">
              <Text className="text-lg">🧾</Text>
              <Text className="text-sm font-extrabold text-[#1d2a23] uppercase tracking-wider">
                Physical Utility Bill (LKR)
              </Text>
            </View>
            {actualBillInput ? (
              <TouchableOpacity onPress={handleClearActualBill}>
                <Text className="text-[11px] font-bold text-rose-500">Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View>
            <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
              Actual Net Bill Amount (LKR)
            </Text>
            <TextInput
              value={actualBillInput}
              onChangeText={(text) => {
                setActualBillInput(text);
                setValidationError('');
              }}
              placeholder="e.g. 4500.00 (Optional)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-[#1d2a23] focus:border-[#3b6e52]"
              style={{ fontSize: 16 }}
            />
            <Text className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              Record the net bill amount from your physical statement to compare actual charges with solar co-op metering accuracy on your dashboard.
            </Text>
          </View>
        </View>

        {/* Validation Error Banner */}
        {(validationError || error) && (
          <View className="mb-4 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex-row items-center gap-3">
            <Text className="text-lg">❌</Text>
            <Text className="text-xs font-bold text-rose-600 flex-1 leading-relaxed">
              {validationError || error}
            </Text>
          </View>
        )}

        {/* Success Banner */}
        {successMsg && (
          <View className="mb-4 bg-[#eef4f0] border border-[#dcece1] rounded-2xl p-4 flex-row items-center gap-3">
            <Text className="text-lg">✅</Text>
            <Text className="text-xs font-bold text-[#3b6e52] flex-1 leading-relaxed">
              {successMsg}
            </Text>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          className="py-4 bg-[#3b6e52] rounded-2xl shadow-lg shadow-[#3b6e52]/30 items-center active:bg-[#345e46]"
        >
          <Text className="text-base font-bold text-white">Save All Settings</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
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
