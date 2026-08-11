import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ErrorProvider } from '../error/ErrorContext';
import BookmarkDetailPage from './BookmarkDetailPage';

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
    fetchBookmark: vi.fn(),
    createBookmark: vi.fn(),
    updateBookmark: vi.fn(),
    patchBookmark: vi.fn(),
    deleteBookmark: vi.fn(),
    fetchCollectionBookmarks: vi.fn(),
  },
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

vi.mock('../api/bookmarks', () => mockBookmarksApi);

vi.mock('../api/collections', () => ({
  fetchCollections: vi.fn().mockResolvedValue([]),
}));

const sampleBookmark = {
  id: 'bm-1',
  url: 'https://example.com',
  title: 'Example Site',
  favicon: 'https://example.com/favicon.ico',
  notes: 'Some notes',
  ownerId: 'auth0|user-1',
  collectionId: 'col-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  collection: { id: 'col-1', name: 'Tech' },
};

describe('BookmarkDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookmarksApi.fetchBookmark.mockResolvedValue(sampleBookmark);
  });

  function renderPage(id: string) {
    return render(
      <ErrorProvider>
        <MemoryRouter initialEntries={[`/bookmarks/${id}`]}>
          <Routes>
            <Route path="/bookmarks/:id" element={<BookmarkDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ErrorProvider>,
    );
  }

  it('shows skeleton loader while fetching', () => {
    mockBookmarksApi.fetchBookmark.mockReturnValue(
      new Promise(() => {
        /* never resolves */
      }),
    );

    renderPage('bm-1');

    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders bookmark metadata in a card', async () => {
    renderPage('bm-1');

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    expect(screen.getByText('https://example.com')).toBeDefined();
  });

  it('renders favicon fallback when null', async () => {
    mockBookmarksApi.fetchBookmark.mockResolvedValue({
      ...sampleBookmark,
      favicon: null,
    });

    renderPage('bm-1');

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    // Should have a LanguageIcon SVG
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('renders notes only when present', async () => {
    renderPage('bm-1');

    await waitFor(() => {
      expect(screen.getByText('Some notes')).toBeDefined();
    });
  });

  it('does not render notes section when null', async () => {
    mockBookmarksApi.fetchBookmark.mockResolvedValue({
      ...sampleBookmark,
      notes: null,
    });

    renderPage('bm-1');

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    expect(screen.queryByText('Notes')).toBeNull();
  });

  it('renders collection chip only when assigned', async () => {
    renderPage('bm-1');

    await waitFor(() => {
      expect(screen.getByText('Tech')).toBeDefined();
    });
  });

  it('renders no collection chip when not assigned', async () => {
    mockBookmarksApi.fetchBookmark.mockResolvedValue({
      ...sampleBookmark,
      collection: null,
      collectionId: null,
    });

    renderPage('bm-1');

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeDefined();
    });

    expect(screen.queryByText('Collection')).toBeNull();
  });

  it('renders URL as clickable link opening in new tab', async () => {
    renderPage('bm-1');

    await waitFor(() => {
      const link = screen.getByText('https://example.com');
      expect(link.closest('a')?.getAttribute('href')).toBe(
        'https://example.com',
      );
      expect(link.closest('a')?.getAttribute('target')).toBe('_blank');
    });
  });

  it('back link navigates to /bookmarks', async () => {
    renderPage('bm-1');

    await waitFor(() => {
      const backLink = screen.getByText('Back to Bookmarks');
      expect(backLink.closest('a')?.getAttribute('href')).toBe('/bookmarks');
    });
  });

  it('shows not found state when bookmark not found', async () => {
    mockBookmarksApi.fetchBookmark.mockRejectedValue(
      new Error('/bookmarks/bm-1 returned 404'),
    );

    renderPage('non-existent');

    await waitFor(() => {
      expect(screen.getByText('Bookmark not found')).toBeDefined();
    });
  });
});
