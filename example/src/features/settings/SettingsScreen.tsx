import { sdkVersion } from 'react-native-sdk-base';
import { appConfig } from '../../core/config';
import { Card, Row, Screen, Title } from '../../core/ui';

/** Read-only diagnostics. The API key is never shown. */
export function SettingsScreen() {
  return (
    <Screen>
      <Title>Diagnostics</Title>
      <Card>
        <Row label="Environment" value={appConfig.environmentLabel} />
        <Row label="API base URL" value={appConfig.apiBaseUrl} />
        <Row label="SDK version" value={sdkVersion} />
        <Row label="Transport" value={appConfig.transportDescription} />
      </Card>
    </Screen>
  );
}
