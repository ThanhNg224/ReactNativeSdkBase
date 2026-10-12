import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme';
import { Body, Title } from './Typography';

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.box}>
      <Title>{title}</Title>
      <Body tone="muted">{message}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
});
