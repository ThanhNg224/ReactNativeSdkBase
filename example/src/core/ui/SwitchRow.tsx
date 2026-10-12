import { Pressable, StyleSheet, Switch, Text } from 'react-native';
import { minTouchTarget, spacing, typography, useTheme } from '../theme';

interface Props {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/** The whole row toggles, so the touch target is the row, not just the switch. */
export function SwitchRow({ label, value, onValueChange }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.row}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Switch
        accessible={false}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.outline, true: theme.primary }}
        thumbColor={theme.surface}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: { ...typography.body, flexShrink: 1 },
});
