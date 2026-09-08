import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatAlertDate } from '../utils/dateUtils';

/**
 * Alert Card component.
 * Brand Aligned: Solar Share styling.
 */
export default function AlertCard({ alert, onMarkAsRead, onDelete }) {
  const { _id, type, severity, message, isRead, createdAt } = alert;

  // Determine styles based on severity
  let severityLabel = 'Warning';
  let badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
  let severityIcon = '⚠️';

  if (severity.toLowerCase() === 'critical') {
    severityLabel = 'Critical';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
    severityIcon = '🚨';
  } else if (severity.toLowerCase() === 'info') {
    severityLabel = 'Info';
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
    severityIcon = 'ℹ️';
  }

  const typeLabel = type ? type.replace(/_/g, ' ') : 'ALERT';

  return (
    <View 
      className={`rounded-[24px] border p-5 mb-4 shadow-sm relative ${
        isRead 
          ? 'bg-white border-slate-200 shadow-slate-100/30' 
          : 'bg-[#eef4f0] border-[#dcece1] shadow-slate-100/10'
      }`}
    >
      {/* Unread indicator dot */}
      {!isRead && (
        <View className="absolute top-5 right-5 w-2.5 h-2.5 bg-[#3b6e52] rounded-full" />
      )}

      {/* Row Header */}
      <View className="flex-row items-center gap-3 mb-2.5">
        <Text className="text-xl">{severityIcon}</Text>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-xs font-black text-slate-400 tracking-wider uppercase">
              {typeLabel}
            </Text>
            
            {/* Severity Badge */}
            <View className={`px-2 py-0.5 rounded-full border ${badgeColor}`}>
              <Text className="text-[10px] font-extrabold uppercase">{severityLabel}</Text>
            </View>
          </View>
          
          <Text className="text-xs text-slate-400 font-semibold mt-0.5">
            {formatAlertDate(createdAt)}
          </Text>
        </View>
      </View>

      {/* Message Body */}
      <Text 
        className={`text-sm leading-relaxed mb-4 ${
          isRead ? 'text-slate-600' : 'font-extrabold text-[#1d2a23]'
        }`}
      >
        {message}
      </Text>

      {/* Action Footer */}
      <View className="flex-row justify-between items-center border-t border-slate-150 pt-3">
        <TouchableOpacity
          onPress={() => onDelete(_id)}
          className="px-3 py-1.5 rounded-lg active:bg-slate-50"
        >
          <Text className="text-xs font-bold text-rose-500">
            Delete Log
          </Text>
        </TouchableOpacity>

        {!isRead && onMarkAsRead && (
          <TouchableOpacity
            onPress={() => onMarkAsRead(_id)}
            className="px-4 py-2 bg-[#3b6e52] rounded-xl active:bg-[#345e46] shadow-sm"
          >
            <Text className="text-xs font-bold text-white">
              Mark as Read
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
