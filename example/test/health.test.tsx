import { screen } from '@testing-library/react-native';
import { FakeSdkHttpTransport } from 'react-native-sdk-base/testing';
import * as healthRepository from '../src/features/health/data/health-repository';
import { checkHealth } from '../src/features/health/data/health-repository';
import { HealthScreen } from '../src/features/health/presentation/HealthScreen';
import { AppFailureError } from '../src/core/errors';
import { makeClient, renderWithProviders } from './helpers';

describe('health data layer', () => {
  it('maps SdkHealth to a domain status', async () => {
    const transport = new FakeSdkHttpTransport().enqueueResponse({
      statusCode: 200,
      body: '{"status":"ok"}',
    });
    const status = await checkHealth(makeClient({ transport }));
    expect(status).toEqual({ isHealthy: true, statusText: 'ok', checkedAt: expect.any(Date) });
  });

  it.each([
    [401, 'unauthorized', false],
    [429, 'rate_limited', true],
    [503, 'server', true],
  ])('maps HTTP %i to an AppFailure with host copy', async (statusCode, code, isRetryable) => {
    const transport = new FakeSdkHttpTransport().enqueueResponse({ statusCode });
    const failure = await checkHealth(makeClient({ transport })).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(AppFailureError);
    expect(failure).toMatchObject({ code, isRetryable, requestId: expect.any(String) });
    expect((failure as AppFailureError).message).not.toMatch(/HTTP|status/i);
  });

  it('maps a transport failure to a retryable failure', async () => {
    const transport = new FakeSdkHttpTransport().enqueueFailure();
    await expect(checkHealth(makeClient({ transport }))).rejects.toMatchObject({
      code: 'transport',
      isRetryable: true,
    });
  });
});

describe('HealthScreen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows loading while the check is pending', async () => {
    jest.spyOn(healthRepository, 'checkHealth').mockReturnValue(new Promise(() => {}));
    await renderWithProviders(<HealthScreen />);
    expect(screen.getByText('Checking...')).toBeTruthy();
  });

  it('shows success', async () => {
    await renderWithProviders(<HealthScreen />);
    expect(await screen.findByText('Healthy')).toBeTruthy();
  });

  it('shows error copy and request id', async () => {
    await renderWithProviders(<HealthScreen />, { fixture: { statusCode: 503 } });
    expect(
      await screen.findByText('The service is having problems. Please try again later.')
    ).toBeTruthy();
    expect(screen.getByText('Request ID')).toBeTruthy();
  });
});
