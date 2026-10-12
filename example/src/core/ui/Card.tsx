import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

export function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.sm, gap: spacing.xs },
});
