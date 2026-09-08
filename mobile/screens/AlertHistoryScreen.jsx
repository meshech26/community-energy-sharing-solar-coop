import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useAlertStore } from '../store/alertStore';
import AlertCard from '../components/AlertCard';
import LoadingComponent from '../components/LoadingComponent';
import ErrorComponent from '../components/ErrorComponent';

/**
 * Alert History Screen.
 * Brand Aligned: Solar Share Green Theme.
 */
export default function AlertHistoryScreen({ navigation }) {
  const { alerts, loading, error, fetchAlerts, markAsRead, markAllAsRead, deleteAlert } = useAlertStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (id) => {
    await deleteAlert(id);
  };

  const hasUnread = alerts.some((a) => !a.isRead);

  if (loading && alerts.length === 0) {
    return <LoadingComponent message="Loading warning history..." />;
  }

  return (
    <View className="flex-1 bg-[#f4f6f5]">
      {/* Header */}
      <View className="px-5 pt-8 pb-5 bg-white border-b border-slate-100 flex-row justify-between items-center shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-slate-50 border border-slate-150 rounded-full justify-center items-center mr-3 active:bg-slate-100"
          >
            <Text className="text-lg font-bold text-slate-700">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-extrabold text-[#1d2a23]">
              Alert History
            </Text>
            <Text className="text-xs text-slate-400 font-semibold mt-0.5">
              System warnings and limits log
            </Text>
          </View>
        </View>

        {/* Mark All as Read Button */}
        {hasUnread && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            className="px-3.5 py-2 bg-[#eef4f0] border border-[#dcece1] active:bg-slate-200 rounded-xl"
          >
            <Text className="text-xs font-extrabold text-[#3b6e52]">
              Read All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List */}
      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3b6e52']} />
        }
      >
        {error && (
          <View className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-rose-600 leading-relaxed">
              {error}
            </Text>
          </View>
        )}

        {alerts.length === 0 ? (
          /* Empty State Illustration */
          <View className="py-20 justify-center items-center">
            <View className="w-20 h-20 bg-[#eef4f0] border border-[#dcece1] rounded-full justify-center items-center mb-5">
              <Text className="text-4xl">✅</Text>
            </View>
            <Text className="text-lg font-bold text-[#1d2a23] text-center">
              All Systems Normal
            </Text>
            <Text className="mt-2 text-xs text-slate-400 text-center max-w-[240px] leading-relaxed">
              No consumption limit warnings or unusual usage patterns have been logged. Keep up the good work!
            </Text>
          </View>
        ) : (
          /* Alert Cards */
          alerts.map((item) => (
            <AlertCard
              key={item._id}
              alert={item}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
