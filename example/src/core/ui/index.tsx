import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { spacing, useTheme } from '../theme';

/** Content at the top, primary action (`footer`) pinned to the lower half. */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.screen}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.content}>{children}</View>
      {footer}
    </ScrollView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface }]}>{children}</View>;
}

export function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

export function Title({ children }: { children: string }) {
  const theme = useTheme();
  return <Text style={[styles.title, { color: theme.text }]}>{children}</Text>;
}

export function Body({ children, tone }: { children: string; tone?: 'danger' | 'muted' }) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : tone === 'muted' ? theme.textMuted : theme.text;
  return <Text style={[styles.body, { color }]}>{children}</Text>;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled === true }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.primary, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={[styles.buttonText, { color: theme.onPrimary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'space-between', padding: spacing.sm, gap: spacing.md },
  content: { gap: spacing.sm },
  card: { borderRadius: 16, padding: spacing.sm, gap: spacing.xs },
  row: { gap: 4 },
  label: { fontSize: 13 },
  // Android's "bold text" setting draws glyphs wider than React Native measured them,
  // which clips the last character of a full line; the inset leaves room for that.
  value: { fontSize: 16, paddingRight: spacing.xs },
  title: { fontSize: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 },
  button: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
