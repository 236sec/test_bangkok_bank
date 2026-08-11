import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LogoutButton from './LogoutButton';

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

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isLoading = false;
  });

  it('renders a button with text "Log out"', () => {
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('calls logout with returnTo window.location.origin on click', () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(mockAuth.logout).toHaveBeenCalledTimes(1);
    expect(mockAuth.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
  });

  it('is disabled while auth state is loading', () => {
    mockAuth.isLoading = true;
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: 'Log out' })).toBeDisabled();
  });
});
