import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthGuard from './AuthGuard';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    isLoading: false,
    isAuthenticated: true,
    user: null,
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAccessTokenSilently: vi.fn().mockResolvedValue('test-access-token'),
  },
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isLoading = false;
    mockAuth.isAuthenticated = true;
  });

  it('renders a loading indicator while auth state is loading', () => {
    mockAuth.isLoading = true;

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('calls loginWithRedirect when not authenticated', () => {
    mockAuth.isAuthenticated = false;

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    expect(mockAuth.loginWithRedirect).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(mockAuth.loginWithRedirect).not.toHaveBeenCalled();
  });
});
