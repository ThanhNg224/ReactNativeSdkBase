import { StyleSheet, Text } from 'react-native';
import { radius, spacing, typography, useTheme } from '../theme';

export function StatusBadge({ label, tone }: { label: string; tone: 'success' | 'danger' }) {
  const theme = useTheme();
  const colors =
    tone === 'success'
      ? { background: theme.successContainer, content: theme.onSuccessContainer }
      : { background: theme.dangerContainer, content: theme.onDangerContainer };
  return (
    <Text style={[styles.badge, { backgroundColor: colors.background, color: colors.content }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    ...typography.label,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 4,
  },
});
