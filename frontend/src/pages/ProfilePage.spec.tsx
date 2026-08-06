import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorProvider } from '../error/ErrorContext';
import ProfilePage from './ProfilePage';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    isLoading: false,
    isAuthenticated: true,
    user: {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      picture: 'https://example.com/ada.png',
    },
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAccessTokenSilently: vi.fn().mockResolvedValue('test-access-token'),
  },
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isLoading = false;
    mockAuth.isAuthenticated = true;
  });

  it('renders the signed-in user name, email, and avatar', () => {
    render(
      <ErrorProvider>
        <ProfilePage />
      </ErrorProvider>,
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('Ada Lovelace')).toHaveAttribute(
      'src',
      'https://example.com/ada.png',
    );
  });

  it('shows the access token once it resolves', async () => {
    render(
      <ErrorProvider>
        <ProfilePage />
      </ErrorProvider>,
    );

    expect(await screen.findByText('test-access-token')).toBeInTheDocument();
  });
});
