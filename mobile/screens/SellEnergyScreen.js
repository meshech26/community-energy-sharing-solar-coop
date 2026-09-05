import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const parseDateString = (str) => {
  if (!str) return new Date();
  const parts = str.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
};

const formatDateString = (d) => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const parseTimeString = (timeStr) => {
  if (!timeStr) return { hour: '09', minute: '00', period: 'AM' };
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    let m = match[2];
    let p = match[3].toUpperCase();
    return {
      hour: String(h).padStart(2, '0'),
      minute: m,
      period: p,
    };
  }
  return { hour: '09', minute: '00', period: 'AM' };
};

export default function SellEnergyScreen({ navigation }) {
  const [quantity, setQuantity] = useState('10');
  const [price, setPrice] = useState('45');
  const [date, setDate] = useState('08/29/2026');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Calendar Modal State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const initialDateObj = parseDateString('08/29/2026');
  const [viewYear, setViewYear] = useState(initialDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDateObj.getMonth());
  const [selectedDateObj, setSelectedDateObj] = useState(initialDateObj);

  // Time Window Modal State
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState('start'); // 'start' | 'end'
  const [tempStartTime, setTempStartTime] = useState('09:00 AM');
  const [tempEndTime, setTempEndTime] = useState('05:00 PM');

  const todayObj = new Date();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const getCalendarDays = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrev: true });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }

    const remainder = days.length % 7;
    if (remainder !== 0) {
      const daysNeeded = 7 - remainder;
      for (let i = 1; i <= daysNeeded; i++) {
        days.push({ day: i, isCurrentMonth: false, isNext: true });
      }
    }
    return days;
  };

  const calendarDays = getCalendarDays(viewYear, viewMonth);

  const activeTimeParsed = parseTimeString(activeTimeField === 'start' ? tempStartTime : tempEndTime);

  const updateActiveTime = (field, value) => {
    const current = { ...activeTimeParsed, [field]: value };
    const formatted = `${current.hour}:${current.minute} ${current.period}`;
    if (activeTimeField === 'start') {
      setTempStartTime(formatted);
    } else {
      setTempEndTime(formatted);
    }
  };

  const handleSubmit = async () => {
    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid energy quantity (e.g. 10 kWh).');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid unit price (e.g. 45 LKR).');
      return;
    }

    setLoading(true);
    try {
      const parsedDate = parseDateString(date);
      await axios.post('http://127.0.0.1:5000/api/energy/listings', {
        quantity: parsedQty,
        unitPrice: parsedPrice,
        availableDate: parsedDate.toISOString(),
        description: description
      });
      navigation.navigate('SellSuccess');
    } catch (e) {
      console.error(e);
      // Fallback for mock if backend fails
      navigation.navigate('MyListings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f9f9f9]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <Text className="text-[#0f6b4b] text-xl font-bold mr-1">.</Text>
          <Text className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Solar Share</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <MaterialCommunityIcons name="logout" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center mb-4">
          <MaterialCommunityIcons name="arrow-left" size={14} color="#0f6b4b" />
          <Text className="text-[#0f6b4b] font-bold ml-1 text-xs">Back to Dashboard</Text>
        </TouchableOpacity>
        
        <Text className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>Sell Energy</Text>
        <Text className="text-gray-600 mb-6 text-sm">List your excess renewable energy on the community marketplace.</Text>

        <View className="bg-[#f6fbf9] rounded-2xl p-5 shadow-sm border border-[#e8f1ec] mb-8">
          
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-800 mb-2">Energy Quantity</Text>
            <View className="border border-gray-300 rounded-lg bg-white flex-row items-center justify-between px-3 py-2">
              <TextInput 
                placeholder="10" 
                className="flex-1 text-sm text-gray-900"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              <Text className="text-gray-600 font-semibold text-xs">kWh</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-gray-800 mb-2">Unit Price</Text>
            <View className="border border-gray-300 rounded-lg bg-white flex-row items-center justify-between px-3 py-2">
              <TextInput 
                placeholder="45" 
                className="flex-1 text-sm text-gray-900"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <Text className="text-gray-600 font-semibold text-xs">LKR/kWh</Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#e8f1ec] mb-6" />

          <Text className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: 'serif' }}>Availability Schedule</Text>
          
          {/* Calendar View for Date */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-800 mb-2">Date</Text>
            <TouchableOpacity 
              onPress={() => {
                const parsed = parseDateString(date);
                setSelectedDateObj(parsed);
                setViewYear(parsed.getFullYear());
                setViewMonth(parsed.getMonth());
                setCalendarModalVisible(true);
              }}
              activeOpacity={0.7}
              className="border border-gray-300 rounded-lg bg-white flex-row items-center px-3 py-2.5 justify-between"
            >
              <View className="flex-row items-center flex-1">
                <MaterialCommunityIcons name="calendar-blank-outline" size={18} color="#0f6b4b" className="mr-2.5" />
                <Text className="text-sm font-semibold text-gray-900">{date || 'Select date'}</Text>
              </View>
              <View className="bg-[#e8f1ec] px-2 py-1 rounded-md flex-row items-center">
                <Text className="text-xs font-bold text-[#0f6b4b] mr-1">Calendar</Text>
                <MaterialCommunityIcons name="calendar-month" size={16} color="#0f6b4b" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Time View for Time Window */}
          <View className="mb-6">
            <Text className="text-xs font-bold text-gray-800 mb-2">Time Window</Text>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity 
                onPress={() => {
                  setTempStartTime(startTime);
                  setTempEndTime(endTime);
                  setActiveTimeField('start');
                  setTimeModalVisible(true);
                }}
                activeOpacity={0.7}
                className="flex-1 border border-gray-300 rounded-lg bg-white flex-row items-center px-3 py-2.5 justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#0f6b4b" className="mr-2" />
                  <Text className="text-sm font-semibold text-gray-900">{startTime || '09:00 AM'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={16} color="#0f6b4b" />
              </TouchableOpacity>
              
              <Text className="mx-2.5 text-gray-400 font-bold">-</Text>
              
              <TouchableOpacity 
                onPress={() => {
                  setTempStartTime(startTime);
                  setTempEndTime(endTime);
                  setActiveTimeField('end');
                  setTimeModalVisible(true);
                }}
                activeOpacity={0.7}
                className="flex-1 border border-gray-300 rounded-lg bg-white flex-row items-center px-3 py-2.5 justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#0f6b4b" className="mr-2" />
                  <Text className="text-sm font-semibold text-gray-900">{endTime || '05:00 PM'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={16} color="#0f6b4b" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-8">
            <View className="flex-row justify-between items-end mb-2">
              <Text className="text-xs font-bold text-gray-800">Description</Text>
              <Text className="text-[10px] text-gray-500">(Optional)</Text>
            </View>
            <View className="border border-gray-300 rounded-lg bg-white px-3 py-3">
              <TextInput 
                placeholder="e.g., Excess solar generation from clear afternoon sky." 
                className="text-sm text-gray-600"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
              <View className="items-end mt-1">
                <MaterialCommunityIcons name="resize-bottom-right" size={10} color="#ccc" />
              </View>
            </View>
          </View>

          <View className="bg-[#e2ebe6] rounded-xl p-5 mb-6 border border-[#c6d8ce]">
            <View className="flex-row items-center mb-3">
              <MaterialCommunityIcons name="cash" size={16} color="#666" />
              <Text className="text-[10px] font-bold text-gray-600 uppercase ml-2 tracking-wider">Estimated Value</Text>
            </View>
            <Text className="text-2xl font-bold text-[#0f6b4b] mb-1">
              LKR <Text className="text-4xl" style={{ fontFamily: 'serif' }}>{parseFloat(quantity || 0) * parseFloat(price || 0)}</Text>
            </Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="information-outline" size={10} color="#666" />
              <Text className="text-[10px] text-gray-600 ml-1 font-semibold">Based on {quantity} kWh @ {price} LKR</Text>
            </View>
          </View>

          <TouchableOpacity 
            className={`bg-[#0f6b4b] rounded-xl py-3.5 flex-row justify-center items-center mb-6 shadow-sm ${loading ? 'opacity-70' : ''}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-sm">Submit for Approval</Text>
            )}
          </TouchableOpacity>

          <View className="bg-[#f0f0f0] rounded-lg p-3 flex-row items-start">
            <MaterialCommunityIcons name="check-circle-outline" size={14} color="#666" className="mr-2 mt-0.5" />
            <Text className="text-[10px] text-gray-700 flex-1 leading-4">
              Listings <Text className="font-bold">must</Text> be approved <Text className="font-bold">by</Text> the Co-op Admin before appearing <Text className="font-bold">in</Text> the marketplace.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Calendar View Modal */}
      <Modal
        visible={calendarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl border border-gray-200">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="calendar" size={20} color="#0f6b4b" className="mr-2" />
                <Text className="text-lg font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Select Date</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setCalendarModalVisible(false)} 
                className="p-1 rounded-full bg-gray-100"
              >
                <MaterialCommunityIcons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View className="flex-row items-center justify-between mb-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
              <TouchableOpacity 
                onPress={handlePrevMonth}
                className="h-8 w-8 rounded-lg bg-white border border-gray-200 items-center justify-center shadow-xs"
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color="#333" />
              </TouchableOpacity>
              <Text className="text-base font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
                {monthNames[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity 
                onPress={handleNextMonth}
                className="h-8 w-8 rounded-lg bg-white border border-gray-200 items-center justify-center shadow-xs"
              >
                <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View className="flex-row justify-between mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                <View key={i} className="w-9 items-center justify-center">
                  <Text className="text-[11px] font-bold text-gray-400 uppercase">{d}</Text>
                </View>
              ))}
            </View>

            {/* Days grid */}
            <View className="flex-row flex-wrap justify-between">
              {calendarDays.map((item, idx) => {
                const isSelected = item.isCurrentMonth && 
                  selectedDateObj.getFullYear() === viewYear &&
                  selectedDateObj.getMonth() === viewMonth &&
                  selectedDateObj.getDate() === item.day;

                const isToday = item.isCurrentMonth &&
                  todayObj.getFullYear() === viewYear &&
                  todayObj.getMonth() === viewMonth &&
                  todayObj.getDate() === item.day;

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      if (item.isCurrentMonth) {
                        setSelectedDateObj(new Date(viewYear, viewMonth, item.day));
                      } else if (item.isPrev) {
                        handlePrevMonth();
                        setSelectedDateObj(new Date(viewYear, viewMonth - 1, item.day));
                      } else {
                        handleNextMonth();
                        setSelectedDateObj(new Date(viewYear, viewMonth + 1, item.day));
                      }
                    }}
                    className={`w-9 h-9 items-center justify-center rounded-xl mb-1.5 ${
                      isSelected 
                        ? 'bg-[#0f6b4b] shadow-sm' 
                        : isToday 
                          ? 'border border-[#0f6b4b] bg-green-50' 
                          : item.isCurrentMonth 
                            ? 'bg-transparent' 
                            : 'opacity-25'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${
                      isSelected 
                        ? 'text-white font-bold' 
                        : isToday 
                          ? 'text-[#0f6b4b] font-bold' 
                          : item.isCurrentMonth 
                            ? 'text-gray-800' 
                            : 'text-gray-400'
                    }`}>
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Presets */}
            <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-100 justify-between">
              <TouchableOpacity 
                onPress={() => {
                  const t = new Date();
                  setViewYear(t.getFullYear());
                  setViewMonth(t.getMonth());
                  setSelectedDateObj(t);
                }}
                className="flex-1 py-1.5 bg-gray-100 rounded-lg items-center mr-1"
              >
                <Text className="text-xs font-bold text-gray-700">Today</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  const t = new Date();
                  t.setDate(t.getDate() + 1);
                  setViewYear(t.getFullYear());
                  setViewMonth(t.getMonth());
                  setSelectedDateObj(t);
                }}
                className="flex-1 py-1.5 bg-gray-100 rounded-lg items-center mr-1"
              >
                <Text className="text-xs font-bold text-gray-700">Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  const t = new Date();
                  t.setDate(t.getDate() + 7);
                  setViewYear(t.getFullYear());
                  setViewMonth(t.getMonth());
                  setSelectedDateObj(t);
                }}
                className="flex-1 py-1.5 bg-gray-100 rounded-lg items-center"
              >
                <Text className="text-xs font-bold text-gray-700">+7 Days</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-gray-100">
              <View>
                <Text className="text-[10px] text-gray-400 uppercase font-bold">Selected</Text>
                <Text className="text-xs font-bold text-[#0f6b4b]">
                  {formatDateString(selectedDateObj)}
                </Text>
              </View>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => setCalendarModalVisible(false)}
                  className="px-3 py-2 rounded-xl border border-gray-300 mr-2"
                >
                  <Text className="text-xs font-bold text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setDate(formatDateString(selectedDateObj));
                    setCalendarModalVisible(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0f6b4b]"
                >
                  <Text className="text-xs font-bold text-white">Apply Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time View Modal */}
      <Modal
        visible={timeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl border border-gray-200">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="clock-time-four-outline" size={20} color="#0f6b4b" className="mr-2" />
                <Text className="text-lg font-bold text-gray-900" style={{ fontFamily: 'serif' }}>Select Time Window</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setTimeModalVisible(false)} 
                className="p-1 rounded-full bg-gray-100"
              >
                <MaterialCommunityIcons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Tabs: Start vs End Time */}
            <View className="flex-row bg-gray-100 p-1 rounded-xl mb-4">
              <TouchableOpacity 
                onPress={() => setActiveTimeField('start')}
                className={`flex-1 py-2 rounded-lg items-center ${activeTimeField === 'start' ? 'bg-white shadow-xs border border-gray-200' : ''}`}
              >
                <Text className={`text-[10px] uppercase font-bold ${activeTimeField === 'start' ? 'text-[#0f6b4b]' : 'text-gray-500'}`}>Start Time</Text>
                <Text className={`text-sm font-bold ${activeTimeField === 'start' ? 'text-[#0f6b4b]' : 'text-gray-700'}`}>
                  {tempStartTime}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setActiveTimeField('end')}
                className={`flex-1 py-2 rounded-lg items-center ${activeTimeField === 'end' ? 'bg-white shadow-xs border border-gray-200' : ''}`}
              >
                <Text className={`text-[10px] uppercase font-bold ${activeTimeField === 'end' ? 'text-[#0f6b4b]' : 'text-gray-500'}`}>End Time</Text>
                <Text className={`text-sm font-bold ${activeTimeField === 'end' ? 'text-[#0f6b4b]' : 'text-gray-700'}`}>
                  {tempEndTime}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Current Active Time Preview */}
            <View className="bg-[#f4f8f6] border border-[#d2e5db] rounded-xl p-3 items-center mb-4">
              <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Setting {activeTimeField === 'start' ? 'Start Time' : 'End Time'}
              </Text>
              <View className="flex-row items-baseline">
                <Text className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
                  {activeTimeParsed.hour}:{activeTimeParsed.minute}
                </Text>
                <Text className="text-base font-bold text-[#0f6b4b] ml-2">
                  {activeTimeParsed.period}
                </Text>
              </View>
            </View>

            {/* Hour Selector */}
            <View className="mb-3">
              <Text className="text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Hour</Text>
              <View className="flex-row flex-wrap justify-between">
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => {
                  const isSelected = activeTimeParsed.hour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      onPress={() => updateActiveTime('hour', h)}
                      className={`w-7 h-7 rounded-lg items-center justify-center mb-1.5 ${
                        isSelected ? 'bg-[#0f6b4b]' : 'bg-gray-100'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {parseInt(h, 10)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Minute & AM/PM Selectors */}
            <View className="flex-row justify-between mb-4">
              {/* Minute */}
              <View className="flex-1 mr-3">
                <Text className="text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Minute</Text>
                <View className="flex-row justify-between">
                  {['00', '15', '30', '45'].map((m) => {
                    const isSelected = activeTimeParsed.minute === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => updateActiveTime('minute', m)}
                        className={`flex-1 py-1.5 mx-0.5 rounded-lg items-center justify-center ${
                          isSelected ? 'bg-[#0f6b4b]' : 'bg-gray-100'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          :{m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* AM / PM */}
              <View className="w-24">
                <Text className="text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Period</Text>
                <View className="flex-row">
                  {['AM', 'PM'].map((p) => {
                    const isSelected = activeTimeParsed.period === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => updateActiveTime('period', p)}
                        className={`flex-1 py-1.5 mx-0.5 rounded-lg items-center justify-center ${
                          isSelected ? 'bg-[#0f6b4b]' : 'bg-gray-100'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Quick Solar Window Presets */}
            <View className="mb-4 pt-3 border-t border-gray-100">
              <Text className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Quick Solar Presets</Text>
              <View className="flex-row flex-wrap justify-between">
                {[
                  { label: '09 AM - 05 PM', start: '09:00 AM', end: '05:00 PM' },
                  { label: '10 AM - 04 PM', start: '10:00 AM', end: '04:00 PM' },
                  { label: '08 AM - 01 PM', start: '08:00 AM', end: '01:00 PM' },
                  { label: '12 PM - 06 PM', start: '12:00 PM', end: '06:00 PM' },
                ].map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setTempStartTime(preset.start);
                      setTempEndTime(preset.end);
                    }}
                    className="w-[48%] py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg items-center mb-1.5"
                  >
                    <Text className="text-[11px] font-semibold text-gray-700">{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Footer */}
            <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
              <View>
                <Text className="text-[10px] text-gray-400 uppercase font-bold">Window</Text>
                <Text className="text-xs font-bold text-[#0f6b4b]">
                  {tempStartTime} - {tempEndTime}
                </Text>
              </View>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => setTimeModalVisible(false)}
                  className="px-3 py-2 rounded-xl border border-gray-300 mr-2"
                >
                  <Text className="text-xs font-bold text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setStartTime(tempStartTime);
                    setEndTime(tempEndTime);
                    setTimeModalVisible(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0f6b4b]"
                >
                  <Text className="text-xs font-bold text-white">Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
