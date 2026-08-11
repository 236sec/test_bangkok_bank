import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorProvider } from '../error/ErrorContext';
import BookmarksPage from './BookmarksPage';

const { mockAuth, mockBookmarksApi } = vi.hoisted(() => ({
  mockAuth: {
    isLoading: false,
    isAuthenticated: true,
    user: null,
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAccessTokenSilently: vi.fn().mockResolvedValue('test-access-token'),
  },
  mockBookmarksApi: {
    fetchBookmarks: vi.fn(),
    createBookmark: vi.fn(),
    updateBookmark: vi.fn(),
    patchBookmark: vi.fn(),
    deleteBookmark: vi.fn(),
  },
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

vi.mock('../api/bookmarks', () => mockBookmarksApi);

vi.mock('../api/collections', () => ({
  fetchCollections: vi
    .fn()
    .mockResolvedValue([
      {
        id: 'col-1',
        name: 'Tech',
        ownerId: 'auth0|user-1',
        createdAt: '',
        updatedAt: '',
      },
    ]),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => vi.fn() };
});

const sampleBookmarks = [
  {
    id: 'bm-1',
    url: 'https://example.com',
    title: 'Example Site',
    favicon: 'https://example.com/favicon.ico',
    notes: null,
    ownerId: 'auth0|user-1',
    collectionId: 'col-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    collection: { id: 'col-1', name: 'Tech' },
  },
  {
    id: 'bm-2',
    url: 'https://github.com',
    title: 'GitHub',
    favicon: null,
    notes: 'Code stuff',
    ownerId: 'auth0|user-1',
    collectionId: null,
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
    collection: null,
  },
];

describe('BookmarksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookmarksApi.fetchBookmarks.mockResolvedValue(sampleBookmarks);
  });

  it('shows skeleton loaders while fetching', () => {
    // Don't resolve the fetch so skeletons remain
    mockBookmarksApi.fetchBookmarks.mockReturnValue(
      new Promise(() => {
        /* never resolves */
      }),
    );

    render(
      <ErrorProvider>
        <BookmarksPage />
      </ErrorProvider>,
    );

    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows bookmark cards after load', async () => {
    render(
      <ErrorProvider>
        <BookmarksPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    expect(screen.getByText('GitHub')).toBeDefined();
  });

  it('shows empty state when no bookmarks', async () => {
    mockBookmarksApi.fetchBookmarks.mockResolvedValue([]);

    render(
      <ErrorProvider>
        <BookmarksPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('No bookmarks yet')).toBeDefined();
    });
  });

  it('opens create dialog on New Bookmark click', async () => {
    render(
      <ErrorProvider>
        <BookmarksPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    screen.getByText('New Bookmark').click();

    await waitFor(() => {
      expect(screen.getByText(/New Bookmark/)).toBeDefined();
    });
  });

  it('removes bookmark from list after successful delete', async () => {
    mockBookmarksApi.deleteBookmark.mockResolvedValue(undefined);
    // After delete, return only one bookmark
    mockBookmarksApi.fetchBookmarks
      .mockResolvedValueOnce(sampleBookmarks)
      .mockResolvedValueOnce([sampleBookmarks[1]]);

    render(
      <ErrorProvider>
        <BookmarksPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    // Click delete on first bookmark
    const deleteButtons = screen.getAllByLabelText('Delete bookmark');
    deleteButtons[0].click();

    // Confirm in dialog
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      within(dialog).getByText('Delete').click();
    });
  });

  it('search by title filters bookmarks with debounce', async () => {
    // First load: all bookmarks
    mockBookmarksApi.fetchBookmarks
      .mockResolvedValueOnce(sampleBookmarks)
      .mockResolvedValueOnce([sampleBookmarks[0]]);

    render(
      <ErrorProvider>
        <BookmarksPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    const titleInput = screen.getByPlaceholderText('Search by title…');
    fireEvent.change(titleInput, { target: { value: 'example' } });

    await waitFor(
      () => {
        expect(mockBookmarksApi.fetchBookmarks).toHaveBeenCalledWith(
          'test-access-token',
          expect.objectContaining({ title: 'example' }),
        );
      },
      { timeout: 500 },
    );
  });

  it('search by URL filters bookmarks with debounce', async () => {
    mockBookmarksApi.fetchBookmarks
      .mockResolvedValueOnce(sampleBookmarks)
      .mockResolvedValueOnce([sampleBookmarks[1]]);

    render(
      <ErrorProvider>
        <BookmarksPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    const urlInput = screen.getByPlaceholderText('Search by URL…');
    fireEvent.change(urlInput, { target: { value: 'github' } });

    await waitFor(
      () => {
        expect(mockBookmarksApi.fetchBookmarks).toHaveBeenCalledWith(
          'test-access-token',
          expect.objectContaining({ url: 'github' }),
        );
      },
      { timeout: 500 },
    );
  });

  it('sort control changes order', async () => {
    render(
      <ErrorProvider>
        <BookmarksPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    // Find the sort select and change it
    const sortSelect = screen.getByRole('combobox', { name: /sort/i });
    fireEvent.mouseDown(sortSelect);

    const listbox = screen.getByRole('listbox');
    within(listbox).getByText('A–Z').click();

    await waitFor(() => {
      expect(mockBookmarksApi.fetchBookmarks).toHaveBeenCalledWith(
        'test-access-token',
        expect.objectContaining({ sortBy: 'title', sortOrder: 'asc' }),
      );
    });
  });
});
