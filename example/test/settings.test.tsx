import { fireEvent, screen } from '@testing-library/react-native';
import { HealthScreen } from '../src/features/health/HealthScreen';
import { SettingsScreen } from '../src/features/settings/SettingsScreen';
import { renderWithProviders } from './helpers';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('SettingsScreen', () => {
  it('rejects an invalid base URL with host copy and keeps the client', async () => {
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.changeText(screen.getByLabelText('API base URL'), 'not a url');
    await fireEvent.press(screen.getByText('Apply'));
    expect(
      await screen.findByText('Enter an absolute http(s) URL without a query or fragment.')
    ).toBeTruthy();
  });

  it('applies a valid base URL', async () => {
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.changeText(screen.getByLabelText('API base URL'), 'https://other.example.test');
    await fireEvent.press(screen.getByText('Apply'));
    expect(screen.queryByText(/Enter an absolute/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('makes Health fail when the simulated error is switched on', async () => {
    await renderWithProviders(
      <>
        <SettingsScreen />
        <HealthScreen />
      </>
    );
    expect(await screen.findByText('Healthy')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('switch', { name: 'Simulate service error (HTTP 503)' })
    );
    expect(
      await screen.findByText('The service is having problems. Please try again later.')
    ).toBeTruthy();
  });
});
