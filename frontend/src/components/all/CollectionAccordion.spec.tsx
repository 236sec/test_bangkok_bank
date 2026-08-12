import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionAccordion from './CollectionAccordion';
import type { Collection } from '../../api/collections';
import type { Bookmark } from '../../api/bookmarks';

const { mockGetToken, mockFetchCollectionBookmarks, mockShowError } =
  vi.hoisted(() => ({
    mockGetToken: vi.fn().mockResolvedValue('test-token'),
    mockFetchCollectionBookmarks: vi.fn(),
    mockShowError: vi.fn(),
  }));

vi.mock('../../auth', () => ({
  useAccessToken: () => mockGetToken,
}));

vi.mock('../../api/bookmarks', () => ({
  fetchCollectionBookmarks: mockFetchCollectionBookmarks,
}));

vi.mock('../../error/useError', () => ({
  useError: () => ({
    error: null,
    showError: mockShowError,
    clearError: vi.fn(),
  }),
}));

const sampleCollection: Collection = {
  id: 'col-1',
  name: 'Tech Articles',
  ownerId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
  _count: { bookmarks: 3 },
};

const sampleBookmark: Bookmark = {
  id: 'bm-1',
  url: 'https://example.com',
  title: 'Example Site',
  favicon: null,
  notes: null,
  ownerId: 'user-1',
  collectionId: 'col-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  collection: { id: 'col-1', name: 'Nested Chip' },
};

const defaultSort = {
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
};

type Props = React.ComponentProps<typeof CollectionAccordion>;

function renderAccordion(overrides: Partial<Props> = {}) {
  const props: Props = {
    collection: sampleCollection,
    bookmarkSort: defaultSort,
    refreshKey: 0,
    onEditCollection: vi.fn(),
    onDeleteCollection: vi.fn(),
    onEditBookmark: vi.fn(),
    onDeleteBookmark: vi.fn(),
    onBookmarkClick: vi.fn(),
    onCreateBookmark: vi.fn(),
    ...overrides,
  };
  const utils = render(<CollectionAccordion {...props} />);
  return { props, ...utils };
}

function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    collection: sampleCollection,
    bookmarkSort: defaultSort,
    refreshKey: 0,
    onEditCollection: vi.fn(),
    onDeleteCollection: vi.fn(),
    onEditBookmark: vi.fn(),
    onDeleteBookmark: vi.fn(),
    onBookmarkClick: vi.fn(),
    onCreateBookmark: vi.fn(),
    ...overrides,
  };
}

describe('CollectionAccordion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue('test-token');
    mockFetchCollectionBookmarks.mockResolvedValue([sampleBookmark]);
  });

  it('renders collection name and bookmark count in the header', () => {
    renderAccordion();
    expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    expect(screen.getByText('3 bookmarks')).toBeInTheDocument();
  });

  it('does not fetch bookmarks on mount (lazy)', () => {
    renderAccordion();
    expect(mockFetchCollectionBookmarks).not.toHaveBeenCalled();
  });

  it('fetches bookmarks on first expand', async () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tech Articles/ }));
    await waitFor(() => {
      expect(mockFetchCollectionBookmarks).toHaveBeenCalledWith(
        'test-token',
        'col-1',
        defaultSort,
      );
    });
  });

  it('shows skeleton loaders while fetching', async () => {
    mockFetchCollectionBookmarks.mockReturnValue(new Promise(() => {}));
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tech Articles/ }));
    await waitFor(() => {
      expect(
        document.querySelectorAll('.MuiSkeleton-root').length,
      ).toBeGreaterThan(0);
    });
  });

  it('renders BookmarkList (bookmark cards) after load', async () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tech Articles/ }));
    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeInTheDocument();
    });
  });

  it('renders empty state when the collection has no bookmarks', async () => {
    mockFetchCollectionBookmarks.mockResolvedValue([]);
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tech Articles/ }));
    await waitFor(() => {
      expect(
        screen.getByText('No bookmarks in this collection yet'),
      ).toBeInTheDocument();
    });
  });

  it('does not refetch when collapsing and re-expanding (cache)', async () => {
    renderAccordion();
    const summary = screen.getByRole('button', { name: /Tech Articles/ });
    fireEvent.click(summary);
    await waitFor(() =>
      expect(mockFetchCollectionBookmarks).toHaveBeenCalledTimes(1),
    );
    fireEvent.click(summary); // collapse
    fireEvent.click(summary); // expand again
    expect(mockFetchCollectionBookmarks).toHaveBeenCalledTimes(1);
  });

  it('refetches when refreshKey changes while loaded', async () => {
    const { rerender } = renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tech Articles/ }));
    await waitFor(() =>
      expect(mockFetchCollectionBookmarks).toHaveBeenCalledTimes(1),
    );

    rerender(<CollectionAccordion {...baseProps({ refreshKey: 1 })} />);

    await waitFor(() =>
      expect(mockFetchCollectionBookmarks).toHaveBeenCalledTimes(2),
    );
  });

  it('refetches when bookmarkSort changes while loaded', async () => {
    const { rerender } = renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tech Articles/ }));
    await waitFor(() =>
      expect(mockFetchCollectionBookmarks).toHaveBeenCalledTimes(1),
    );

    const newSort = { sortBy: 'title' as const, sortOrder: 'asc' as const };
    rerender(<CollectionAccordion {...baseProps({ bookmarkSort: newSort })} />);

    await waitFor(() =>
      expect(mockFetchCollectionBookmarks).toHaveBeenCalledTimes(2),
    );
    expect(mockFetchCollectionBookmarks).toHaveBeenLastCalledWith(
      'test-token',
      'col-1',
      newSort,
    );
  });

  it('does not refetch when refreshKey/bookmarkSort changes while not loaded', () => {
    const { rerender } = renderAccordion();
    rerender(
      <CollectionAccordion
        {...baseProps({
          refreshKey: 1,
          bookmarkSort: { sortBy: 'title', sortOrder: 'asc' },
        })}
      />,
    );
    expect(mockFetchCollectionBookmarks).not.toHaveBeenCalled();
  });

  it('edit button calls onEditCollection and does not toggle expansion', () => {
    const onEditCollection = vi.fn();
    renderAccordion({ onEditCollection });
    const summary = screen.getByRole('button', { name: /Tech Articles/ });
    expect(summary).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByLabelText('Edit collection'));
    expect(onEditCollection).toHaveBeenCalled();
    expect(summary).toHaveAttribute('aria-expanded', 'false');
  });

  it('delete button calls onDeleteCollection and does not toggle expansion', () => {
    const onDeleteCollection = vi.fn();
    renderAccordion({ onDeleteCollection });
    const summary = screen.getByRole('button', { name: /Tech Articles/ });
    expect(summary).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByLabelText('Delete collection'));
    expect(onDeleteCollection).toHaveBeenCalled();
    expect(summary).toHaveAttribute('aria-expanded', 'false');
  });

  it('wires bookmark edit/delete/click callbacks to BookmarkCard', async () => {
    const onEditBookmark = vi.fn();
    const onDeleteBookmark = vi.fn();
    const onBookmarkClick = vi.fn();
    renderAccordion({ onEditBookmark, onDeleteBookmark, onBookmarkClick });

    fireEvent.click(screen.getByRole('button', { name: /Tech Articles/ }));
    await waitFor(() =>
      expect(screen.getByText('Example Site')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText('Edit bookmark'));
    expect(onEditBookmark).toHaveBeenCalledWith(sampleBookmark);

    fireEvent.click(screen.getByLabelText('Delete bookmark'));
    expect(onDeleteBookmark).toHaveBeenCalledWith(sampleBookmark);

    fireEvent.click(screen.getByText('Example Site'));
    expect(onBookmarkClick).toHaveBeenCalledWith(sampleBookmark);
  });

  it('hides the collection chip inside the accordion (showCollectionChip={false})', async () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tech Articles/ }));
    await waitFor(() =>
      expect(screen.getByText('Example Site')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Nested Chip')).toBeNull();
  });

  it('retries the fetch on re-expand after a failed first load', async () => {
    mockFetchCollectionBookmarks.mockRejectedValueOnce(new Error('network'));
    renderAccordion();
    const summary = screen.getByRole('button', { name: /Tech Articles/ });

    fireEvent.click(summary); // first expand -> fetch fails
    await waitFor(() =>
      expect(mockFetchCollectionBookmarks).toHaveBeenCalledTimes(1),
    );

    fireEvent.click(summary); // collapse
    fireEvent.click(summary); // re-expand -> should retry
    await waitFor(() =>
      expect(mockFetchCollectionBookmarks).toHaveBeenCalledTimes(2),
    );
  });
});
