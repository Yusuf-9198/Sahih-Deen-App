import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { ResultCard } from '@/components/ResultCard';
import type { VerifyResponse } from '@/lib/types';

export default function ResultScreen() {
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-5 py-6">
      <Text className="font-sans-semibold text-sm uppercase tracking-wide text-slate-500">
        Your quote
      </Text>
      <View className="rounded-2xl border border-border bg-surface p-4">
        <Text className="font-sans text-base leading-6 text-slate-200">{result.query}</Text>
      </View>

      <Text className="mt-2 font-sans-semibold text-sm uppercase tracking-wide text-slate-500">
        Match
      </Text>
      <ResultCard result={result} />
    </ScrollView>
  );
}
