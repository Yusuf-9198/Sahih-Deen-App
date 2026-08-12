import { Text, View } from 'react-native';

import { VERDICT_COLORS, VERDICT_LABELS, type VerifyResponse } from '@/lib/types';

type Props = {
  result: VerifyResponse;
  compact?: boolean;
};

export function ResultCard({ result, compact = false }: Props) {
  const color = result.color || VERDICT_COLORS[result.verdict];
  const scorePct = `${Math.round((result.similarity || 0) * 100)}%`;
  const meterWidth = `${Math.min(Math.max((result.similarity || 0) * 100, 4), 100)}%`;

  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-surface/95 p-4">
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <Text className="font-sans-semibold text-sm text-white">{VERDICT_LABELS[result.verdict]}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-background/80">
            <View className="h-2 rounded-full" style={{ width: meterWidth, backgroundColor: color }} />
          </View>
        </View>
        <View className="rounded-full border border-border bg-background/70 px-3 py-1.5">
          <Text className="font-sans-bold text-sm" style={{ color }}>
            {scorePct}
          </Text>
        </View>
      </View>

      {!compact && result.match?.arabic_text ? (
        <Text
          className="mb-3 text-right font-arabic text-2xl leading-10 text-white"
          style={{ writingDirection: 'rtl' }}
        >
          {result.match.arabic_text}
        </Text>
      ) : null}

      {!compact && result.match?.english_text ? (
        <Text className="mb-4 font-sans text-base leading-7 text-slate-200">
          {result.match.english_text}
        </Text>
      ) : null}

      {result.match ? (
        <View className="mb-4 gap-2 rounded-2xl border border-border bg-background/50 p-3">
          {result.match.source ? (
            <MetaRow label="Source" value={result.match.source} />
          ) : null}
          {result.match.reference ? (
            <MetaRow label="Reference" value={result.match.reference} />
          ) : null}
          {result.match.collection ? (
            <MetaRow label="Collection" value={result.match.collection} />
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
