import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ThemeSchemeContext, type ThemeScheme } from '../../core/theme';
import {
  Body,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  SectionHeader,
  StatusBadge,
  SwitchRow,
  TextField,
  Title,
} from '../../core/ui';

/**
 * Every kit component in every state, for one-screenshot visual checks.
 * Open `reactnativesdkbaseexample://gallery?scheme=dark` to start in dark mode.
 */
export function GalleryScreen() {
  const { scheme } = useLocalSearchParams<{ scheme?: string }>();
  const [dark, setDark] = useState(scheme === 'dark');
  const [switched, setSwitched] = useState(true);
  const [text, setText] = useState('https://api.example.test');
  const override: ThemeScheme = dark ? 'dark' : 'light';

  return (
    <ThemeSchemeContext.Provider value={override}>
      <Screen>
        <Title>Gallery</Title>
        <Card>
          <SwitchRow label="Dark" value={dark} onValueChange={setDark} />
        </Card>

        <SectionHeader>Text</SectionHeader>
        <Card>
          <Title>Title</Title>
          <Body>Body text</Body>
          <Body tone="muted">Muted body text</Body>
          <Body tone="danger">Danger body text</Body>
          <ListRow label="Label" value="Value" />
        </Card>

        <SectionHeader>Buttons</SectionHeader>
        <Button title="Primary" onPress={noop} />
        <Button title="Tonal" variant="tonal" onPress={noop} />
        <Button title="Danger" variant="danger" onPress={noop} />
        <Button title="Loading" loading onPress={noop} />
        <Button title="Disabled" disabled onPress={noop} />

        <SectionHeader>Status</SectionHeader>
        <Card>
          <StatusBadge label="Healthy" tone="success" />
          <StatusBadge label="Unhealthy" tone="danger" />
          <LoadingState label="Loading..." />
          <ErrorState message="The service is having problems." requestId="req-123" />
          <ErrorState message="The device could not provide this information." />
          <EmptyState title="Nothing here" message="There is no data to show yet." />
        </Card>

        <SectionHeader>Inputs</SectionHeader>
        <Card>
          <TextField label="Text field" value={text} onChangeText={setText} />
          <TextField label="With error" value="not a url" onChangeText={noop} error="Invalid URL" />
          <SwitchRow label="Switch row" value={switched} onValueChange={setSwitched} />
        </Card>
      </Screen>
    </ThemeSchemeContext.Provider>
  );
}

function noop() {}
