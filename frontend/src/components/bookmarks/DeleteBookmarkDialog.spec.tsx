import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DeleteBookmarkDialog from './DeleteBookmarkDialog';

describe('DeleteBookmarkDialog', () => {
  it('renders bookmark title in warning message', () => {
    render(
      <DeleteBookmarkDialog
        open={true}
        bookmarkTitle="Example Site"
        onClose={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/Example Site/)).toBeDefined();
  });

  it('Cancel button closes dialog', () => {
    const onClose = vi.fn();
    render(
      <DeleteBookmarkDialog
        open={true}
        bookmarkTitle="Example Site"
        onClose={onClose}
        onDelete={vi.fn()}
      />,
    );

    screen.getByText('Cancel').click();
    expect(onClose).toHaveBeenCalled();
  });

  it('Delete button calls onDelete', () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <DeleteBookmarkDialog
        open={true}
        bookmarkTitle="Example Site"
        onClose={vi.fn()}
        onDelete={onDelete}
      />,
    );

    screen.getByText('Delete').click();
    expect(onDelete).toHaveBeenCalled();
  });

  it('both buttons disabled while deleting', () => {
    const onDelete = vi.fn(
      () =>
        new Promise<void>(() => {
          /* never resolves */
        }),
    );
    render(
      <DeleteBookmarkDialog
        open={true}
        bookmarkTitle="Example Site"
        onClose={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
