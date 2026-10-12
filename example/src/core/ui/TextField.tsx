import { StyleSheet, Text, TextInput, View } from 'react-native';
import { minTouchTarget, radius, spacing, typography, useTheme } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Validation message; also switches the border to the danger colour. */
  error?: string;
}

export function TextField({ label, value, onChangeText, error }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        value={value}
        onChangeText={onChangeText}
        selectionColor={theme.primary}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.surfaceTonal,
            borderColor: error === undefined ? theme.outline : theme.danger,
          },
        ]}
      />
      {error !== undefined ? (
        <Text accessibilityLiveRegion="polite" style={[styles.label, { color: theme.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: typography.label,
  input: {
    ...typography.body,
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
});
