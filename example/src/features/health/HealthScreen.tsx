import {
  Button,
  Card,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  StatusBadge,
  Title,
} from '../../core/ui';
import { useHealthCheck } from './use-health-check';

export function HealthScreen() {
  const query = useHealthCheck();
  return (
    <Screen
      footer={
        <Button
          title="Check again"
          loading={query.isFetching}
          onPress={() => void query.refetch()}
        />
      }>
      <Title>Service health</Title>
      <Card>
        {query.isPending ? <LoadingState label="Checking..." /> : null}
        {query.isError ? (
          <ErrorState message={query.error.message} requestId={query.error.requestId} />
        ) : null}
        {query.data !== undefined ? (
          <>
            <StatusBadge
              label={query.data.isHealthy ? 'Healthy' : 'Unhealthy'}
              tone={query.data.isHealthy ? 'success' : 'danger'}
            />
            <ListRow label="Reported" value={query.data.statusText} />
            <ListRow label="Checked at" value={query.data.checkedAt.toLocaleTimeString()} />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}
