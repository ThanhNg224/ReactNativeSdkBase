import { Body, Card, PrimaryButton, Row, Screen, Title } from '../../core/ui';
import { useDeviceDetails } from './use-device-details';

export function DeviceScreen() {
  const query = useDeviceDetails();
  return (
    <Screen
      footer={
        <PrimaryButton
          title="Read again"
          disabled={query.isFetching}
          onPress={() => void query.refetch()}
        />
      }>
      <Title>Device</Title>
      <Card>
        {query.isPending ? <Body tone="muted">Reading...</Body> : null}
        {query.isError ? <Body tone="danger">{query.error.message}</Body> : null}
        {query.data !== undefined ? (
          <>
            <Row label="Platform" value={query.data.platformLabel} />
            <Row label="OS version" value={query.data.osVersion} />
            <Row label="App ID" value={query.data.appId} />
            <Row label="App version" value={query.data.appVersionLabel} />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}
