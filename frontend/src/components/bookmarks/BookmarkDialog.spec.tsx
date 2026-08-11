import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookmarkDialog from './BookmarkDialog';

const mockUseAccessToken = vi.fn().mockResolvedValue('test-access-token');
const mockShowError = vi.fn();
const mockFetchCollections = vi.fn();

vi.mock('../../auth', () => ({
  useAccessToken: () => mockUseAccessToken,
}));

vi.mock('../../error/useError', () => ({
  useError: () => ({ showError: mockShowError }),
}));

vi.mock('../../api/collections', () => ({
  fetchCollections: (...args: unknown[]) => mockFetchCollections(...args),
}));

describe('BookmarkDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCollections.mockResolvedValue([
      {
        id: 'col-1',
        name: 'Tech',
        ownerId: 'auth0|user-1',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'col-2',
        name: 'Design',
        ownerId: 'auth0|user-1',
        createdAt: '',
        updatedAt: '',
      },
    ]);
  });

  describe('create mode', () => {
    it('renders create title and URL field', () => {
      render(
        <BookmarkDialog open={true} onClose={vi.fn()} onCreate={vi.fn()} />,
      );

      expect(screen.getByText('New Bookmark')).toBeDefined();
      expect(screen.getByLabelText('URL')).toBeDefined();
      expect(screen.getByText('Create')).toBeDefined();
    });

    it('primary button disabled when URL is empty', () => {
      render(
        <BookmarkDialog open={true} onClose={vi.fn()} onCreate={vi.fn()} />,
      );

      expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    });
  });

  describe('edit mode', () => {
    const bookmark = {
      id: 'bm-1',
      url: 'https://example.com',
      title: 'Example Site',
      notes: 'Some notes',
      collectionId: 'col-1',
    };

    it('renders edit title and pre-filled fields', () => {
      render(
        <BookmarkDialog
          open={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          bookmark={bookmark}
        />,
      );

      expect(screen.getByText('Edit Bookmark')).toBeDefined();
      expect(screen.getByDisplayValue('https://example.com')).toBeDefined();
      expect(screen.getByDisplayValue('Example Site')).toBeDefined();
      expect(screen.getByText('Save')).toBeDefined();
    });

    it('calls onSave when submitted after changing URL', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(
        <BookmarkDialog
          open={true}
          onClose={vi.fn()}
          onSave={onSave}
          bookmark={bookmark}
        />,
      );

      const urlInput = screen.getByLabelText('URL');
      fireEvent.change(urlInput, { target: { value: 'https://updated.com' } });

      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          'bm-1',
          expect.objectContaining({
            url: 'https://updated.com',
            title: 'Example Site',
          }),
        );
      });
    });
  });
});
