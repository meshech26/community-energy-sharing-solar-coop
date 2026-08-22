import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-3xl font-bold text-green-600">
        Community Energy Sharing
      </Text>

      <Text className="mt-3 text-base text-gray-600">
        Solar Co-op Mobile Application
      </Text>

      <StatusBar style="dark" />
    </View>
  );
}