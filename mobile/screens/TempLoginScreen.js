import React, { useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import client from "../services/client";
import { useAuthStore } from "../store/authStore";
import PrimaryButton from "../components/PrimaryButton";

export default function TempLoginScreen({ navigation }) {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("test1234");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await client.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      navigation.replace("Progress");
    } catch (err) {
      Alert.alert("Login failed", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-surface px-6">
      <Text className="text-xs font-semibold text-sun uppercase tracking-widest mb-2 text-center">Dev only</Text>
      <Text className="text-2xl font-bold text-ink text-center mb-8">Test Login</Text>

      <TextInput
        className="border border-border rounded-2xl px-4 py-4 text-base text-ink bg-white mb-4"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        className="border border-border rounded-2xl px-4 py-4 text-base text-ink bg-white mb-6"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <PrimaryButton label="Log in" onPress={handleLogin} loading={loading} />
    </View>
  );
}