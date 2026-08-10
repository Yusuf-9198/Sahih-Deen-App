import { Text, View } from 'react-native';

import { VERDICT_COLORS, VERDICT_LABELS, type VerifyResponse } from '@/lib/types';

type Props = {
  result: VerifyResponse;
  compact?: boolean;
};

export function ResultCard({ result, compact = false }: Props) {
  const color = result.color || VERDICT_COLORS[result.verdict];
  const scorePct = `${Math.round((result.similarity || 0) * 100)}%`;

  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <Text className="font-sans-semibold text-sm text-white">{VERDICT_LABELS[result.verdict]}</Text>
        </View>
        <Text className="font-sans-bold text-sm" style={{ color }}>
          {scorePct}
        </Text>
      </View>

      {!compact && result.match?.arabic_text ? (
        <Text className="mb-2 text-right font-arabic text-xl leading-9 text-white" style={{ writingDirection: 'rtl' }}>
          {result.match.arabic_text}
        </Text>
      ) : null}

      {!compact && result.match?.english_text ? (
        <Text className="mb-3 font-sans text-base leading-6 text-slate-200">{result.match.english_text}</Text>
      ) : null}

      {result.match ? (
        <View className="mb-3 gap-1">
          {result.match.source ? (
            <MetaRow label="Source" value={result.match.source} />
          ) : null}
          {result.match.reference ? (
            <MetaRow label="Reference" value={result.match.reference} />
          ) : null}
          {result.match.grading ? (
            <MetaRow label="Grading" value={result.match.grading} />
          ) : null}
        </View>
      ) : null}

      {result.summary ? (
        <Text className="font-sans text-sm leading-5 text-muted">{result.summary}</Text>
      ) : null}

      {compact ? (
        <Text className="mt-2 font-sans text-xs text-slate-500" numberOfLines={2}>
          {result.query}
        </Text>
      ) : null}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row flex-wrap gap-x-2">
      <Text className="font-sans-medium text-xs uppercase tracking-wide text-slate-500">{label}</Text>
      <Text className="font-sans text-sm text-slate-200">{value}</Text>
    </View>
  );
}
