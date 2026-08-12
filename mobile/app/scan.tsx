import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';

/** Expo Go-safe scan flow for web and native clients. */
export default function ScanScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="w-full rounded-[32px] border border-border bg-surface px-5 py-6">
        <Text className="mb-2 text-center font-sans-semibold text-xs uppercase tracking-[0.35em] text-primary/80">
          Expo Go Scan
        </Text>
        <Text className="mb-3 text-center font-sans-bold text-2xl leading-8 text-white">
          Use the native app for photo picking and manual transcription.
        </Text>
        <Text className="mb-6 text-center font-sans text-base leading-7 text-muted">
          If this route is shown on web, use the home screen paste flow instead. On mobile Expo Go,
          the scan screen uses the same supported image picker flow.
        </Text>
        <AppButton label="Back to Home" onPress={() => router.replace('/')} />
      </View>
    </View>
  );
}
