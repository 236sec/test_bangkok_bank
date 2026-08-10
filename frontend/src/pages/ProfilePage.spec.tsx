import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorProvider } from '../error/ErrorContext';
import ProfilePage from './ProfilePage';

const { mockAuth, mockFetchMe } = vi.hoisted(() => ({
  mockAuth: {
    isLoading: false,
    isAuthenticated: true,
    user: null,
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAccessTokenSilently: vi.fn().mockResolvedValue('test-access-token'),
  },
  mockFetchMe: vi.fn().mockResolvedValue({ sub: 'auth0|user-123' }),
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

vi.mock('../api/me', () => ({
  fetchMe: mockFetchMe,
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isLoading = false;
    mockAuth.isAuthenticated = true;
    mockFetchMe.mockResolvedValue({ sub: 'auth0|user-123' });
  });

  it('renders the user sub from /me', async () => {
    render(
      <ErrorProvider>
        <ProfilePage />
      </ErrorProvider>,
    );

    expect(await screen.findAllByText('auth0|user-123')).toHaveLength(2);
  });

  it('calls fetchMe with the access token', async () => {
    render(
      <ErrorProvider>
        <ProfilePage />
      </ErrorProvider>,
    );

    await screen.findAllByText('auth0|user-123');

    expect(mockAuth.getAccessTokenSilently).toHaveBeenCalledTimes(1);
    expect(mockFetchMe).toHaveBeenCalledWith('test-access-token');
  });
});
