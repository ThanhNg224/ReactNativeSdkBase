import { StyleSheet, Text } from 'react-native';
import { typography, useTheme } from '../theme';

export function SectionHeader({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.header, { color: theme.textMuted }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: typography.label,
});
