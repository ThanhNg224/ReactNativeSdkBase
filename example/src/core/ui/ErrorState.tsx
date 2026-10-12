import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, useTheme } from '../theme';
import { ListRow } from './ListRow';

/** User-facing failure copy, plus the request ID support needs when the SDK supplied one. */
export function ErrorState({
  message,
  requestId,
}: {
  message: string;
  requestId?: string | undefined;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: theme.dangerContainer }]}>
      <Text style={[styles.message, { color: theme.onDangerContainer }]}>{message}</Text>
      {requestId !== undefined ? <ListRow label="Request ID" value={requestId} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  message: typography.body,
});
