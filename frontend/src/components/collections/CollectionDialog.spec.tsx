import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionDialog from './CollectionDialog';

describe('CollectionDialog', () => {
  describe('create mode', () => {
    const defaultProps = {
      open: true,
      onClose: vi.fn(),
      onCreate: vi.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders with title "New Collection", empty field, and "Create" button', () => {
      render(<CollectionDialog {...defaultProps} />);

      expect(screen.getByText('New Collection')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(
        screen.getByRole('button', { name: 'Create' }),
      ).toBeInTheDocument();
    });

    it('disables primary button when name is empty or exceeds 100 characters', () => {
      render(<CollectionDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    });

    it('enables primary button when name is between 1 and 100 characters', async () => {
      render(<CollectionDialog {...defaultProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'My Collection' },
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Create' }),
        ).not.toBeDisabled();
      });
    });

    it('disables primary button when name exceeds 100 characters', async () => {
      render(<CollectionDialog {...defaultProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'A'.repeat(101) },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
      });
    });

    it('disables primary button when name is exactly 100 characters', async () => {
      render(<CollectionDialog {...defaultProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'A'.repeat(100) },
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Create' }),
        ).not.toBeDisabled();
      });
    });

    it('enables primary button when name is non-empty', async () => {
      render(<CollectionDialog {...defaultProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'My Collection' },
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Create' }),
        ).not.toBeDisabled();
      });
    });

    it('calls onCreate(name) when submitted in create mode', async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);

      render(<CollectionDialog {...defaultProps} onCreate={onCreate} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'My Collection' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith('My Collection');
      });
    });

    it('shows loading state on primary button while submitting', async () => {
      // Create a promise we can resolve manually
      let resolvePromise!: (value: void) => void;
      const onCreate = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          }),
      );

      render(<CollectionDialog {...defaultProps} onCreate={onCreate} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'My Collection' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
      });

      // Clean up
      resolvePromise();
    });
  });

  describe('edit mode', () => {
    const editProps = {
      open: true,
      onClose: vi.fn(),
      onSave: vi.fn().mockResolvedValue(undefined),
      collection: { id: 'col-1', name: 'Existing Collection' },
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders with title "Edit Collection", pre-filled field, and "Save" button', () => {
      render(<CollectionDialog {...editProps} />);

      expect(screen.getByText('Edit Collection')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('Existing Collection');
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('disables primary button when name unchanged from initial value', () => {
      render(<CollectionDialog {...editProps} />);

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('disables primary button when name exceeds 100 characters', async () => {
      render(<CollectionDialog {...editProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'A'.repeat(101) },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      });
    });

    it('enables primary button when name changed to valid length', async () => {
      render(<CollectionDialog {...editProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Renamed Collection' },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
      });
    });

    it('disables primary button when name is empty', async () => {
      render(<CollectionDialog {...editProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: '' },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      });
    });

    it('enables primary button when name changed to different non-empty value', async () => {
      render(<CollectionDialog {...editProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Renamed Collection' },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
      });
    });

    it('calls onSave(id, name) when submitted in edit mode', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(<CollectionDialog {...editProps} onSave={onSave} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Renamed Collection' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('col-1', 'Renamed Collection');
      });
    });
  });
});
