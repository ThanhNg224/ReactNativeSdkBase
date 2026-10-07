import { Body, Card, PrimaryButton, Row, Screen, Title } from '../../core/ui';
import { useHealthCheck } from './use-health-check';

export function HealthScreen() {
  const query = useHealthCheck();
  return (
    <Screen
      footer={
        <PrimaryButton
          title="Check again"
          disabled={query.isFetching}
          onPress={() => void query.refetch()}
        />
      }>
      <Title>Service health</Title>
      <Card>
        {query.isPending ? <Body tone="muted">Checking...</Body> : null}
        {query.isError ? (
          <>
            <Body tone="danger">{query.error.message}</Body>
            {query.error.requestId !== undefined ? (
              <Row label="Request ID" value={query.error.requestId} />
            ) : null}
          </>
        ) : null}
        {query.data !== undefined ? (
          <>
            <Row label="Status" value={query.data.isHealthy ? 'Healthy' : 'Unhealthy'} />
            <Row label="Reported" value={query.data.statusText} />
            <Row label="Checked at" value={query.data.checkedAt.toLocaleTimeString()} />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}
