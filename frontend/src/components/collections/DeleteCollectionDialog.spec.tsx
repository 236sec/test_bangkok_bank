import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DeleteCollectionDialog from './DeleteCollectionDialog';

describe('DeleteCollectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    collectionName: 'My Collection',
    onClose: vi.fn(),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };

  it('renders with collection name in the warning message', () => {
    render(<DeleteCollectionDialog {...defaultProps} />);

    expect(screen.getByText('Delete collection?')).toBeInTheDocument();
    expect(
      screen.getByText(
        "This will delete the collection 'My Collection'. Bookmarks in this collection will become uncategorized.",
      ),
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();

    render(<DeleteCollectionDialog {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when Delete button is clicked', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(<DeleteCollectionDialog {...defaultProps} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state on Delete button during API call', async () => {
    let resolvePromise!: (value: void) => void;
    const onDelete = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    render(<DeleteCollectionDialog {...defaultProps} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    });

    resolvePromise();
  });
});
