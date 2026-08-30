import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-8"
      >
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-green-700 mb-2">Solar Co-op</Text>
          <Text className="text-gray-500 text-base">Sign in to your account</Text>
        </View>

        <View className="space-y-4">
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 ml-1 font-medium">Email</Text>
            <TextInput
              className="w-full bg-gray-100 px-4 py-3 rounded-xl border border-gray-200"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-2">
            <Text className="text-gray-700 mb-1 ml-1 font-medium">Password</Text>
            <TextInput
              className="w-full bg-gray-100 px-4 py-3 rounded-xl border border-gray-200"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          
          <TouchableOpacity className="self-end mb-6">
            <Text className="text-green-600 font-medium">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-full bg-green-600 py-4 rounded-xl items-center shadow-sm"
            onPress={handleLogin}
          >
            <Text className="text-white font-bold text-lg">Login</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500">Don't have an account? </Text>
          <TouchableOpacity>
            <Text className="text-green-600 font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
