import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { ResultCard } from '@/components/ResultCard';
import type { VerifyResponse } from '@/lib/types';

export default function ResultScreen() {
  const router = useRouter();
  const { payload } = useLocalSearchParams<{ payload?: string }>();

  let result: VerifyResponse | null = null;
  try {
    result = payload ? (JSON.parse(payload) as VerifyResponse) : null;
  } catch {
    result = null;
  }

  if (!result) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="font-sans text-base text-muted">No verification result to show.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-5 py-6 pb-10">
      <View className="overflow-hidden rounded-[32px] border border-border bg-surface px-5 py-5">
        <Text className="font-sans-semibold text-xs uppercase tracking-[0.35em] text-primary/80">
          Verification Result
        </Text>
        <Text className="mt-3 font-sans-bold text-3xl leading-10 text-white">
          Review the matched source and similarity score.
        </Text>
      </View>

      <Text className="mt-2 font-sans-semibold text-sm uppercase tracking-wide text-slate-500">
        Your quote
      </Text>
      <View className="rounded-[28px] border border-border bg-surface p-4">
        <Text className="font-sans text-base leading-7 text-slate-200">{result.query}</Text>
      </View>

      <Text className="mt-2 font-sans-semibold text-sm uppercase tracking-wide text-slate-500">
        Match
      </Text>
      <ResultCard result={result} />

      <View className="mt-2 gap-3">
        <AppButton label="Verify Another Quote" onPress={() => router.replace('/')} />
        <AppButton label="Scan Image" onPress={() => router.replace('/scan')} variant="secondary" />
      </View>
    </ScrollView>
  );
}
