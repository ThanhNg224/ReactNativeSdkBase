import { StyleSheet, Text } from 'react-native';
import { typography, useTheme } from '../theme';

export function Title({ children }: { children: string }) {
  const theme = useTheme();
  return <Text style={[styles.title, { color: theme.text }]}>{children}</Text>;
}

export function Body({ children, tone }: { children: string; tone?: 'danger' | 'muted' }) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : tone === 'muted' ? theme.textMuted : theme.text;
  return <Text style={[styles.body, { color }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: typography.headline,
  body: typography.body,
});
