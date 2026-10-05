import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { SdkClient } from 'react-native-sdk-base';
import { SdkClientProvider, useSdkClient } from '../src/app-providers/SdkClientProvider';

describe('SdkClientProvider', () => {
  it('creates one client across re-renders and closes it on unmount', async () => {
    const seen: SdkClient[] = [];
    function Probe() {
      seen.push(useSdkClient());
      return <Text>ready</Text>;
    }
    const ui = (
      <SdkClientProvider>
        <Probe />
      </SdkClientProvider>
    );
    const { rerender, unmount } = await render(ui);
    await screen.findByText('ready');
    await rerender(ui);
    expect(new Set(seen).size).toBe(1);

    await unmount();
    await waitFor(() => expect(seen[0]!.health.check()).rejects.toThrow(/closed/i));
  });
});
