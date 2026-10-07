import { screen } from '@testing-library/react-native';
import { FakeSdkNativeBridge } from 'react-native-sdk-base/testing';
import { toAppFailure } from '../src/core/errors';
import { readDeviceDetails } from '../src/features/device/read-device-details';
import { DeviceScreen } from '../src/features/device/DeviceScreen';
import { makeClient, renderWithProviders } from './helpers';

describe('device data layer', () => {
  it('maps SdkDeviceInfo to domain details', async () => {
    const nativeBridge = new FakeSdkNativeBridge();
    await expect(readDeviceDetails(makeClient({ nativeBridge }))).resolves.toEqual({
      platformLabel: 'Android',
      osVersion: '15',
      appId: 'com.example.host',
      appVersionLabel: '1.0.0 (1)',
    });
  });

  it('maps native_unavailable to friendly non-retryable copy', async () => {
    const nativeBridge = new FakeSdkNativeBridge().failUnavailable();
    const failure = await readDeviceDetails(makeClient({ nativeBridge })).catch((e: unknown) => e);
    expect(failure).toMatchObject({ code: 'native_unavailable', isRetryable: false });
    expect((failure as Error).message).toMatch(/development build/);
  });

  it('maps malformed native output to invalid_response', async () => {
    const nativeBridge = new FakeSdkNativeBridge().respondWith({ platform: 'web' });
    await expect(readDeviceDetails(makeClient({ nativeBridge }))).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('maps non-SDK errors to an unknown failure', () => {
    expect(toAppFailure(new Error('boom'))).toEqual({
      code: 'unknown',
      message: 'Something went wrong.',
      isRetryable: false,
    });
  });
});

describe('DeviceScreen', () => {
  it('shows loading while the native call is pending', async () => {
    await renderWithProviders(<DeviceScreen />, { nativeBridge: new FakeSdkNativeBridge().hang() });
    expect(screen.getByText('Reading...')).toBeTruthy();
  });

  it('shows success', async () => {
    await renderWithProviders(<DeviceScreen />, { nativeBridge: new FakeSdkNativeBridge() });
    expect(await screen.findByText('com.example.host')).toBeTruthy();
  });

  it('shows the friendly message when the native module is unavailable', async () => {
    await renderWithProviders(<DeviceScreen />, {
      nativeBridge: new FakeSdkNativeBridge().failUnavailable(),
    });
    expect(await screen.findByText(/development build/)).toBeTruthy();
  });

  it('uses the real native module by default, which is unavailable under Jest', async () => {
    await renderWithProviders(<DeviceScreen />);
    expect(await screen.findByText(/development build/)).toBeTruthy();
  });
});
