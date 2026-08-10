import { useMutation } from '@tanstack/react-query';
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
import { API_BASE_URL, getErrorMessage, verifyQuote } from '@/lib/api';
import { clearRecent, loadRecent, saveVerification } from '@/lib/storage';
import type { RecentVerification } from '@/lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<RecentVerification[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecent().then(setRecent);
    }, [])
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
              <Text className="font-sans-bold text-3xl text-primary">VeritasAI</Text>
              <Text className="mt-2 font-sans text-base leading-6 text-muted">
                Verify Islamic quotes against authentic Quranic and Hadith sources.
              </Text>

              <View className="mt-8">
                <AppButton label="Scan Image" onPress={() => router.push('/scan')} />
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
                className="min-h-[120px] rounded-2xl border border-border bg-surface px-4 py-3 font-sans text-base text-white"
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
