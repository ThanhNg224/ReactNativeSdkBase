import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '../theme';
import { Body } from './Typography';

export function LoadingState({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={styles.row}>
      <ActivityIndicator color={theme.primary} />
      <Body tone="muted">{label}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
