import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, PRESET_USERS } from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState('normal'); // 'normal' | 'member2' | 'admin'
  const [name, setName] = useState(PRESET_USERS.normal.name);
  const [email, setEmail] = useState(PRESET_USERS.normal.email);
  const [password, setPassword] = useState('password123');

  const { login, loginWithRole } = useAuthStore();

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setName(PRESET_USERS.admin.name);
      setEmail(PRESET_USERS.admin.email);
    } else if (role === 'member2') {
      setName(PRESET_USERS.member2.name);
      setEmail(PRESET_USERS.member2.email);
    } else {
      setName(PRESET_USERS.normal.name);
      setEmail(PRESET_USERS.normal.email);
    }
  };

  const handleQuickLogin = (role) => {
    loginWithRole(role);
    navigation.replace('MainTabs');
  };

  const handleLogin = () => {
    const isAdmin = selectedRole === 'admin' || email.toLowerCase().includes('admin');
    const basePreset = isAdmin 
      ? PRESET_USERS.admin 
      : (selectedRole === 'member2' ? PRESET_USERS.member2 : PRESET_USERS.normal);

    login({
      ...basePreset,
      name: name || basePreset.name,
      email: email || basePreset.email,
      isCoopAdmin: isAdmin,
    });

    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-6">
          <View className="items-center mb-6">
            <View className="bg-green-100 p-4 rounded-full mb-3">
              <MaterialCommunityIcons name="solar-panel-large" size={36} color="#0f6b4b" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'serif' }}>Solar Share</Text>
            <Text className="text-gray-500 text-sm">Community Energy Sharing Solar Co-op</Text>
          </View>

          {/* Role Selection Box */}
          <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Member (Dev / Testing)</Text>
              <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-amber-800">Co-op Auth</Text>
              </View>
            </View>

            {/* Role Tabs */}
            <View className="flex-row bg-gray-200/70 p-1 rounded-xl mb-4">
              <TouchableOpacity
                onPress={() => handleSelectRole('normal')}
                className={`flex-1 py-2 rounded-lg items-center justify-center ${
                  selectedRole === 'normal' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text 
                  className={`text-[11px] font-bold ${
                    selectedRole === 'normal' ? 'text-[#0f6b4b]' : 'text-gray-600'
                  }`}
                >
                  Member 1
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectRole('member2')}
                className={`flex-1 py-2 rounded-lg items-center justify-center ${
                  selectedRole === 'member2' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text 
                  className={`text-[11px] font-bold ${
                    selectedRole === 'member2' ? 'text-[#0f6b4b]' : 'text-gray-600'
                  }`}
                >
                  Member 2
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectRole('admin')}
                className={`flex-1 py-2 rounded-lg items-center justify-center ${
                  selectedRole === 'admin' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text 
                  className={`text-[11px] font-bold ${
                    selectedRole === 'admin' ? 'text-[#0f6b4b]' : 'text-gray-600'
                  }`}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            {/* Role Details */}
            <View className="bg-white p-3 rounded-xl border border-gray-100 mb-2">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-bold text-gray-800">
                    {selectedRole === 'admin' 
                      ? 'Co-op Administrator' 
                      : (selectedRole === 'member2' ? 'Sunil Fernando (Member 2)' : 'Kavindi Perera (Member 1)')}
                  </Text>
                  <Text className="text-[11px] text-gray-500">
                    {selectedRole === 'admin' 
                      ? 'Admin Approvals + Full Features' 
                      : 'Marketplace, Sell Energy, My Listings, Orders'}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-md ${selectedRole === 'admin' ? 'bg-purple-100' : 'bg-emerald-100'}`}>
                  <Text className={`text-[10px] font-bold ${selectedRole === 'admin' ? 'text-purple-800' : 'text-emerald-800'}`}>
                    {selectedRole === 'admin' ? 'Admin' : 'Member'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick 1-Tap Login Buttons */}
            <View className="flex-row space-x-1.5 mt-2">
              <TouchableOpacity
                onPress={() => handleQuickLogin('normal')}
                className="flex-1 bg-emerald-50 border border-emerald-300 py-2 rounded-xl items-center mr-1"
              >
                <Text className="text-emerald-800 text-[11px] font-bold">⚡ Kavindi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickLogin('member2')}
                className="flex-1 bg-teal-50 border border-teal-300 py-2 rounded-xl items-center mr-1"
              >
                <Text className="text-teal-800 text-[11px] font-bold">⚡ Sunil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickLogin('admin')}
                className="flex-1 bg-purple-50 border border-purple-300 py-2 rounded-xl items-center"
              >
                <Text className="text-purple-800 text-[11px] font-bold">🛡️ Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            <View className="mb-3">
              <Text className="text-gray-700 mb-1 ml-1 text-xs font-semibold">Member Name</Text>
              <TextInput
                className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 mb-1 ml-1 text-xs font-semibold">Email Address</Text>
              <TextInput
                className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="mb-2">
              <Text className="text-gray-700 mb-1 ml-1 text-xs font-semibold">Password</Text>
              <TextInput
                className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm"
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            
            <TouchableOpacity className="self-end mb-4">
              <Text className="text-[#0f6b4b] text-xs font-medium">Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="w-full bg-[#0f6b4b] py-3.5 rounded-xl items-center shadow-sm"
              onPress={handleLogin}
            >
              <Text className="text-white font-bold text-base">
                Sign In as {selectedRole === 'admin' ? 'Admin' : (name || 'Member')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 text-xs">Need a cooperative account? </Text>
            <TouchableOpacity>
              <Text className="text-[#0f6b4b] font-bold text-xs">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
