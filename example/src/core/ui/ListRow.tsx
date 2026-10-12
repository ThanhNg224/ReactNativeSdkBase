import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography, useTheme } from '../theme';

export function ListRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text selectable style={[styles.value, { color: theme.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 4 },
  label: typography.label,
  // Android's "bold text" setting draws glyphs wider than React Native measured them,
  // which clips the last character of a full line; the inset leaves room for that.
  value: { ...typography.body, paddingRight: spacing.xs },
});
