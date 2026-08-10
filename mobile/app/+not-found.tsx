import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="font-sans-bold text-xl text-white">This screen does not exist.</Text>
        <Link href="/" className="mt-4">
          <Text className="font-sans text-base text-primary">Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}
