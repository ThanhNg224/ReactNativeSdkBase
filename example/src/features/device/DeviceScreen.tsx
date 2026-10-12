import { Button, Card, ErrorState, ListRow, LoadingState, Screen, Title } from '../../core/ui';
import { useDeviceDetails } from './use-device-details';

export function DeviceScreen() {
  const query = useDeviceDetails();
  return (
    <Screen
      footer={
        <Button
          title="Read again"
          loading={query.isFetching}
          onPress={() => void query.refetch()}
        />
      }>
      <Title>Device</Title>
      <Card>
        {query.isPending ? <LoadingState label="Reading..." /> : null}
        {query.isError ? <ErrorState message={query.error.message} /> : null}
        {query.data !== undefined ? (
          <>
            <ListRow label="Platform" value={query.data.platformLabel} />
            <ListRow label="OS version" value={query.data.osVersion} />
            <ListRow label="App ID" value={query.data.appId} />
            <ListRow label="App version" value={query.data.appVersionLabel} />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}
