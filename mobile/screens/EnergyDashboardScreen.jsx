import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useEnergyStore } from '../store/energyStore';
import { useAlertStore } from '../store/alertStore';
import { useAuthStore } from '../store/authStore';
import SolarGenerationCard from '../components/SolarGenerationCard';
import ConsumptionCard from '../components/ConsumptionCard';
import EnergyBalanceCard from '../components/EnergyBalanceCard';
import MonthlyUsageCard from '../components/MonthlyUsageCard';
import EnergyChart from '../components/EnergyChart';
import LoadingComponent from '../components/LoadingComponent';
import ErrorComponent from '../components/ErrorComponent';

/**
 * Energy Monitoring Dashboard Screen.
 * Brand Aligned: Solar Share Green Theme.
 */
export default function EnergyDashboardScreen({ navigation }) {
  const { dashboard, energyHistory, loading, error, fetchDashboard, fetchEnergyHistory, simulateEnergy } = useEnergyStore();
  const { unreadCount, fetchUnreadCount } = useAlertStore();
  const token = useAuthStore((state) => state.token);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!token) return;
    await Promise.all([
      fetchDashboard(),
      fetchEnergyHistory('7d'),
      fetchUnreadCount()
    ]);
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchDashboard();
      fetchUnreadCount();
    }, 45000);

    return () => clearInterval(interval);
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTriggerSimulation = async (triggerAnomaly = false) => {
    const res = await simulateEnergy(10, true, triggerAnomaly);
    if (res.success) {
      alert(triggerAnomaly ? 'Simulator loaded: Anomalous usage added!' : 'Simulator loaded: 10 days of hourly logs created successfully.');
    } else {
      alert(`Simulation failed: ${res.error}`);
    }
  };

  if (loading && !dashboard) {
    return <LoadingComponent message="Loading energy telemetry..." />;
  }

  if (error && !dashboard) {
    return <ErrorComponent error={error} onRetry={loadData} />;
  }

  return (
    <ScrollView
      className="flex-1 bg-[#f4f6f5]"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3b6e52']} />
      }
    >
      {/* Header Container */}
      <View className="px-5 pt-8 pb-5 bg-white border-b border-slate-100 flex-row justify-between items-center shadow-sm">
        <View className="flex-row items-center gap-3">
          {/* Logo icon matching the Solar Share rounded green icon */}
          <View className="w-10 h-10 bg-[#3b6e52] rounded-xl justify-center items-center">
            <Text className="text-white text-base">☀️</Text>
          </View>
          <View>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Solar Share
            </Text>
            <Text className="text-xl font-extrabold text-[#1d2a23]">
              Energy Monitor
            </Text>
          </View>
        </View>

        {/* Alerts Bell Badge */}
        <TouchableOpacity
          onPress={() => navigation.navigate('AlertHistory')}
          className="w-11 h-11 bg-slate-50 rounded-full justify-center items-center border border-slate-100 relative active:bg-slate-100"
        >
          <Text className="text-lg">🔔</Text>
          {unreadCount > 0 && (
            <View className="absolute -top-1.5 -right-1.5 bg-[#3b6e52] rounded-full min-w-[20px] h-5 justify-center items-center px-1.5 border border-white">
              <Text className="text-[10px] font-extrabold text-white">
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <View className="px-5 pt-5">
        {/* Core telemetry cards */}
        <SolarGenerationCard solar={dashboard?.solar} />
        <ConsumptionCard consumption={dashboard?.consumption} />
        <EnergyBalanceCard balance={dashboard?.balance} />
        <MonthlyUsageCard limitData={dashboard?.limit} />

        {/* Historical bar trends */}
        <EnergyChart historyData={energyHistory} />

        {/* Navigation Actions */}
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            onPress={() => navigation.navigate('EnergyLimit')}
            className="flex-1 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm items-center active:bg-slate-50"
          >
            <Text className="text-sm font-bold text-slate-600">
              ⚙️ Configure Limit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('AlertHistory')}
            className="flex-1 py-4 bg-[#3b6e52] rounded-2xl shadow-md shadow-[#3b6e52]/20 items-center active:bg-[#345e46]"
          >
            <Text className="text-sm font-bold text-white">
              📋 Alert History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prototype Simulators Panel */}
        <View className="mt-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Text className="text-sm font-bold text-[#1d2a23] mb-1">
            Grading & Prototyping Tools
          </Text>
          <Text className="text-xs text-slate-400 mb-4 leading-relaxed">
            Generate mock energy records over the past 10 days to fill the dashboard and trigger alert logic.
          </Text>
          
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleTriggerSimulation(false)}
              className="flex-1 py-3.5 bg-[#3b6e52] rounded-xl items-center active:bg-[#345e46]"
            >
              <Text className="text-xs font-bold text-white">
                Generate Normal Data
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTriggerSimulation(true)}
              className="flex-1 py-3.5 bg-white border border-[#3b6e52] rounded-xl items-center active:bg-slate-50"
            >
              <Text className="text-xs font-bold text-[#3b6e52]">
                Generate Anomaly
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
