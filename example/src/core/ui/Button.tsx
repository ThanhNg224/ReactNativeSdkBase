import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing, typography, useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'tonal' | 'danger';

interface Props {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Shows a spinner and blocks presses; the label stays so the button keeps its width. */
  loading?: boolean;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const theme = useTheme();
  const colors = {
    primary: { background: theme.primary, content: theme.onPrimary },
    tonal: { background: theme.primaryContainer, content: theme.onPrimaryContainer },
    danger: { background: theme.dangerContainer, content: theme.onDangerContainer },
  }[variant];
  const blocked = disabled === true || loading === true;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading === true }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.background, opacity: blocked ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      {loading === true ? <ActivityIndicator color={colors.content} /> : null}
      <Text style={[styles.text, { color: colors.content }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  text: typography.title,
});
