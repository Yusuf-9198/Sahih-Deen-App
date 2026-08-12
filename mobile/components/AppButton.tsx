import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: Props) {
  const isDisabled = disabled || loading;

  const base = 'items-center justify-center rounded-2xl px-5 py-4';
  const styles =
    variant === 'primary'
      ? 'bg-primary'
      : variant === 'secondary'
        ? 'border border-border bg-surface'
        : 'bg-transparent';

  const text =
    variant === 'primary' ? 'text-slate-950' : variant === 'secondary' ? 'text-white' : 'text-primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`${base} ${styles} ${isDisabled ? 'opacity-50' : 'opacity-100'}`}
      style={({ pressed }) => [{ transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }] }]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#0f172a' : '#10b981'} />
      ) : (
        <Text className={`font-sans-bold text-base ${text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
