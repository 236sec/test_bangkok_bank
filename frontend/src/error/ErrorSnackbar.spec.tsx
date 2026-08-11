import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorSnackbar from './ErrorSnackbar';

const { mockUseError } = vi.hoisted(() => ({
  mockUseError: {
    error: null as string | null,
    showError: vi.fn(),
    clearError: vi.fn(),
  },
}));

vi.mock('./useError', () => ({
  useError: () => mockUseError,
}));

describe('ErrorSnackbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseError.error = null;
    mockUseError.clearError.mockReset();
  });

  it('renders the error message in a MUI Alert when error is set', () => {
    mockUseError.error = 'Token refresh failed — please log in again.';

    render(<ErrorSnackbar />);

    expect(
      screen.getByText('Token refresh failed — please log in again.'),
    ).toBeInTheDocument();
  });

  it('renders a close button', () => {
    mockUseError.error = 'Token refresh failed — please log in again.';

    render(<ErrorSnackbar />);

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('renders nothing when there is no error', () => {
    const { container } = render(<ErrorSnackbar />);

    expect(container.firstChild).toBeNull();
  });

  it('calls clearError when the close button is clicked', () => {
    mockUseError.error = 'Test error';

    render(<ErrorSnackbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(mockUseError.clearError).toHaveBeenCalledTimes(1);
  });
});
