import { useRouter } from 'expo-router';
import { useState } from 'react';
import { sdkVersion } from 'react-native-sdk-base';
import { useSdkSettings } from '../../app-providers/SdkClientProvider';
import { appConfig } from '../../core/config';
import {
  Button,
  Card,
  ListRow,
  Screen,
  SectionHeader,
  SwitchRow,
  TextField,
  Title,
} from '../../core/ui';

/** Runtime settings and diagnostics. The API key is never shown. */
export function SettingsScreen() {
  const router = useRouter();
  const { settings, apply } = useSdkSettings();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [error, setError] = useState<string>();

  return (
    <Screen
      footer={
        <Button
          title="Apply"
          disabled={baseUrl === settings.baseUrl}
          onPress={() => setError(apply({ ...settings, baseUrl }))}
        />
      }>
      <Title>Settings</Title>
      <SectionHeader>Connection</SectionHeader>
      <Card>
        <TextField
          label="API base URL"
          value={baseUrl}
          onChangeText={(value) => {
            setBaseUrl(value);
            setError(undefined);
          }}
          error={error}
        />
        <SwitchRow
          label="Simulate service error (HTTP 503)"
          value={settings.simulateFailure}
          onValueChange={(simulateFailure) => apply({ ...settings, simulateFailure })}
        />
      </Card>
      <SectionHeader>Diagnostics</SectionHeader>
      <Card>
        <ListRow label="Environment" value={appConfig.environmentLabel} />
        <ListRow label="SDK version" value={sdkVersion} />
        <ListRow label="Transport" value={appConfig.transportDescription} />
      </Card>
      <Button title="Component gallery" variant="tonal" onPress={() => router.push('/gallery')} />
    </Screen>
  );
}
