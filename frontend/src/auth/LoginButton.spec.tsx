import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginButton from './LoginButton';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    isLoading: false,
    isAuthenticated: false,
    user: null,
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAccessTokenSilently: vi.fn().mockResolvedValue('test-access-token'),
  },
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isLoading = false;
  });

  it('renders a button with text "Log in"', () => {
    render(<LoginButton />);
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('calls loginWithRedirect with appState.returnTo "/profile" on click', () => {
    render(<LoginButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(mockAuth.loginWithRedirect).toHaveBeenCalledTimes(1);
    expect(mockAuth.loginWithRedirect).toHaveBeenCalledWith({
      appState: { returnTo: '/profile' },
    });
  });

  it('is disabled while auth state is loading', () => {
    mockAuth.isLoading = true;
    render(<LoginButton />);
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();
  });
});
