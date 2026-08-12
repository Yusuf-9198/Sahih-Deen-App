import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ResultCard } from '@/components/ResultCard';
import { API_BASE_URL, checkHealth, getDevHostHint, getErrorMessage, verifyQuote } from '@/lib/api';
import { clearRecent, loadRecent, saveVerification } from '@/lib/storage';
import type { RecentVerification } from '@/lib/types';

const EXAMPLES = [
  'Actions are but by intentions.',
  'Whoever believes in Allah and the Last Day should speak good or remain silent.',
  'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
];

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<RecentVerification[]>([]);
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    staleTime: 60_000,
  });

  useFocusEffect(
    useCallback(() => {
      loadRecent().then(setRecent);
      healthQuery.refetch();
    }, [healthQuery.refetch])
  );

  const mutation = useMutation({
    mutationFn: verifyQuote,
    onSuccess: async (data) => {
      const next = await saveVerification(data);
      setRecent(next);
      router.push({
        pathname: '/result',
        params: { payload: JSON.stringify(data) },
      });
    },
    onError: (err: unknown) => {
      Alert.alert(
        'Could not verify',
        `${getErrorMessage(err)}\n\nAPI: ${API_BASE_URL}`
      );
    },
  });

  const onVerifyPaste = () => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      Alert.alert('Enter text', 'Paste at least a few characters to verify.');
      return;
    }
    mutation.mutate(trimmed);
  };

  const onClearRecent = () => {
    Alert.alert('Clear history?', 'This removes recent verifications from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearRecent();
          setRecent([]);
        },
      },
    ]);
  };

  const status = healthQuery.data;
  const statusLabel = healthQuery.isLoading
    ? 'Checking backend'
    : status
      ? status.qdrant === 'ok'
        ? `Backend online · ${status.points ?? 0} passages`
        : `Backend warmup · ${status.qdrant}`
      : 'Backend offline';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          data={recent}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View className="pb-6 pt-4">
              <View className="overflow-hidden rounded-[32px] border border-border bg-surface px-5 py-6">
                <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10" />
                <View className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-sky-500/10" />
                <Text className="font-sans-semibold text-xs uppercase tracking-[0.35em] text-primary/80">
                  VeritasAI
                </Text>
                <Text className="mt-3 max-w-[320px] font-sans-bold text-4xl leading-[44px] text-white">
                  Verify quotes with Quran and Hadith evidence.
                </Text>
                <Text className="mt-3 font-sans text-base leading-7 text-muted">
                  Paste a quote for instant analysis or use camera OCR on a development build.
                  The backend boots with a sample corpus and can expand with internet-backed data.
                </Text>

                <View className="mt-5 flex-row flex-wrap gap-2">
                  <View className="rounded-full border border-border bg-background/60 px-3 py-2">
                    <Text className="font-sans-medium text-xs uppercase tracking-wide text-slate-200">
                      {statusLabel}
                    </Text>
                  </View>
                  <View className="rounded-full border border-border bg-background/60 px-3 py-2">
                    <Text className="font-sans-medium text-xs uppercase tracking-wide text-slate-200">
                      {status?.embedding_model ?? 'Multilingual embedding model'}
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 font-sans text-xs leading-5 text-slate-400">
                  {getDevHostHint()}
                </Text>

                <View className="mt-5">
                  <AppButton label="Scan Image" onPress={() => router.push('/scan')} />
                </View>
              </View>

              <View className="mt-5 rounded-[28px] border border-border bg-surface px-4 py-4">
                <Text className="mb-3 font-sans-semibold text-sm uppercase tracking-wide text-slate-500">
                  Try an example
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {EXAMPLES.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setQuery(item)}
                      className="rounded-full border border-border bg-background/60 px-3 py-2"
                    >
                      <Text className="max-w-[260px] font-sans text-xs leading-4 text-slate-200">
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Text className="mb-2 mt-8 font-sans-semibold text-sm uppercase tracking-wide text-slate-500">
                Paste Text
              </Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                multiline
                placeholder="Paste Arabic or English quote…"
                placeholderTextColor="#64748b"
                textAlignVertical="top"
                className="min-h-[140px] rounded-[28px] border border-border bg-surface px-4 py-4 font-sans text-base text-white"
              />
              <View className="mt-3">
                <AppButton
                  label="Verify Text"
                  onPress={onVerifyPaste}
                  loading={mutation.isPending}
                  variant="secondary"
                />
              </View>

              <View className="mb-3 mt-10 flex-row items-center justify-between">
                <Text className="font-sans-semibold text-sm uppercase tracking-wide text-slate-500">
                  Recent Verifications
                </Text>
                {recent.length > 0 ? (
                  <Pressable onPress={onClearRecent} accessibilityRole="button">
                    <Text className="font-sans-medium text-sm text-primary">Clear</Text>
                  </Pressable>
                ) : null}
              </View>
              {recent.length === 0 ? (
                <Text className="font-sans text-sm text-slate-500">
                  No verifications yet. Scan an image or paste a quote to begin.
                </Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              className="mb-3"
              onPress={() =>
                router.push({
                  pathname: '/result',
                  params: { payload: JSON.stringify(item) },
                })
              }
            >
              <ResultCard result={item} compact />
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
