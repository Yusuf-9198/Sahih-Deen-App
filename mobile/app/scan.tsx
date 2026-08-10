import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';

/** Web / fallback scan screen — Vision Camera is native-only. */
export default function ScanScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="mb-2 text-center font-sans-bold text-xl text-white">Camera OCR</Text>
      <Text className="mb-6 text-center font-sans text-base leading-6 text-muted">
        On-device scanning needs the native app (Android/iOS development build). Paste the quote on
        the home screen instead, or open this screen from a device build.
      </Text>
      <AppButton label="Back to Home" onPress={() => router.replace('/')} />
    </View>
  );
}
