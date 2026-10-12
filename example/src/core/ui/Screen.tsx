import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'space-between', padding: spacing.sm, gap: spacing.md },
  content: { gap: spacing.sm },
});
