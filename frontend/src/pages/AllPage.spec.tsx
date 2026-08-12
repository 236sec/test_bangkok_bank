import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AllPage from './AllPage';
import type { Bookmark } from '../api/bookmarks';

const {
  mockAuth,
  mockCollectionsApi,
  mockBookmarksApi,
  mockNavigate,
  mockShowError,
  mockCollectionAccordion,
} = vi.hoisted(() => ({
  mockAuth: {
    isLoading: false,
    isAuthenticated: true,
    user: null,
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAccessTokenSilently: vi.fn().mockResolvedValue('test-access-token'),
  },
  mockCollectionsApi: {
    fetchCollections: vi.fn(),
    createCollection: vi.fn(),
    updateCollection: vi.fn(),
    deleteCollection: vi.fn(),
  },
  mockBookmarksApi: {
    createBookmark: vi.fn(),
    updateBookmark: vi.fn(),
    deleteBookmark: vi.fn(),
  },
  mockNavigate: vi.fn(),
  mockShowError: vi.fn(),
  mockCollectionAccordion: vi.fn(),
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

vi.mock('../api/collections', () => mockCollectionsApi);

vi.mock('../api/bookmarks', () => mockBookmarksApi);

vi.mock('../error/useError', () => ({
  useError: () => ({
    error: null,
    showError: mockShowError,
    clearError: vi.fn(),
  }),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../components/all/CollectionAccordion', () => ({
  default: (props: {
    collection: { id: string; name: string };
    bookmarkSort: { sortBy: string; sortOrder: string };
    refreshKey: number;
    onEditCollection: () => void;
    onDeleteCollection: () => void;
    onEditBookmark: (bookmark: Bookmark) => void;
    onDeleteBookmark: (bookmark: Bookmark) => void;
    onBookmarkClick: (bookmark: Bookmark) => void;
    onCreateBookmark: () => void;
  }) => {
    mockCollectionAccordion(props);
    return (
      <div data-testid={`accordion-${props.collection.id}`}>
        <span>{props.collection.name}</span>
        <span data-testid={`bookmark-sort-${props.collection.id}`}>
          {props.bookmarkSort.sortBy}:{props.bookmarkSort.sortOrder}
        </span>
        <span data-testid={`refresh-key-${props.collection.id}`}>
          {props.refreshKey}
        </span>
        <button
          type="button"
          aria-label="Edit collection"
          onClick={props.onEditCollection}
        />
        <button
          type="button"
          aria-label="Delete collection"
          onClick={props.onDeleteCollection}
        />
      </div>
    );
  },
}));

const sampleCollections = [
  {
    id: 'col-1',
    name: 'Tech Articles',
    ownerId: 'user-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
    _count: { bookmarks: 3 },
  },
  {
    id: 'col-2',
    name: 'Recipes',
    ownerId: 'user-1',
    createdAt: '2025-01-03T00:00:00.000Z',
    updatedAt: '2025-01-03T00:00:00.000Z',
    _count: { bookmarks: 0 },
  },
];

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
  collection: { id: 'col-1', name: 'Tech Articles' },
};

function getAccordionProps(id: string) {
  const call = mockCollectionAccordion.mock.calls.find(
    (c) => (c[0] as { collection: { id: string } }).collection.id === id,
  );
  return call?.[0] as
    | {
        collection: { id: string; name: string };
        bookmarkSort: { sortBy: string; sortOrder: string };
        refreshKey: number;
        onEditCollection: () => void;
        onDeleteCollection: () => void;
        onEditBookmark: (bookmark: Bookmark) => void;
        onDeleteBookmark: (bookmark: Bookmark) => void;
        onBookmarkClick: (bookmark: Bookmark) => void;
        onCreateBookmark: () => void;
      }
    | undefined;
}

describe('AllPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.getAccessTokenSilently.mockResolvedValue('test-access-token');
    mockCollectionsApi.fetchCollections.mockResolvedValue(sampleCollections);
    mockCollectionsApi.createCollection.mockResolvedValue({
      id: 'col-new',
      name: 'New Collection',
      ownerId: 'user-1',
      createdAt: '2025-06-01T00:00:00.000Z',
      updatedAt: '2025-06-01T00:00:00.000Z',
      _count: { bookmarks: 0 },
    });
    mockCollectionsApi.updateCollection.mockResolvedValue({
      id: 'col-1',
      name: 'Updated Collection',
      ownerId: 'user-1',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-06-01T00:00:00.000Z',
      _count: { bookmarks: 3 },
    });
    mockCollectionsApi.deleteCollection.mockResolvedValue(undefined);
    mockBookmarksApi.createBookmark.mockResolvedValue(sampleBookmark);
    mockBookmarksApi.updateBookmark.mockResolvedValue(sampleBookmark);
    mockBookmarksApi.deleteBookmark.mockResolvedValue(undefined);
  });

  it('fetches collections on mount', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledWith(
        'test-access-token',
        expect.objectContaining({ sortBy: 'createdAt', sortOrder: 'desc' }),
      ),
    );
  });

  it('shows skeleton loaders while fetching collections', () => {
    mockCollectionsApi.fetchCollections.mockReturnValue(new Promise(() => {}));
    render(<AllPage />);
    expect(
      document.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders accordions after load', async () => {
    render(<AllPage />);
    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
      expect(screen.getByText('Recipes')).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no collections', async () => {
    mockCollectionsApi.fetchCollections.mockResolvedValue([]);
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('No collections yet')).toBeInTheDocument(),
    );
  });

  it('collections sort control changes order', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({ sortBy: 'createdAt', sortOrder: 'desc' }),
    );

    const select = screen.getByRole('combobox', { name: 'Collections sort' });
    fireEvent.mouseDown(select);
    fireEvent.click(within(screen.getByRole('listbox')).getByText('A–Z'));

    await waitFor(() =>
      expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledWith(
        'test-access-token',
        expect.objectContaining({ sortBy: 'name', sortOrder: 'asc' }),
      ),
    );
  });

  it('bookmarks sort control is passed down to accordions', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    expect(screen.getByTestId('bookmark-sort-col-1')).toHaveTextContent(
      'createdAt:desc',
    );

    const select = screen.getByRole('combobox', { name: 'Bookmarks sort' });
    fireEvent.mouseDown(select);
    fireEvent.click(within(screen.getByRole('listbox')).getByText('A–Z'));

    await waitFor(() =>
      expect(screen.getByTestId('bookmark-sort-col-1')).toHaveTextContent(
        'title:asc',
      ),
    );
  });

  it('"New Collection" opens CollectionDialog in create mode', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'New Collection' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Collection name')).toBeInTheDocument();
  });

  it('"New Bookmark" opens BookmarkDialog in create mode', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'New Bookmark' }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
  });

  it('edit icon opens CollectionDialog in edit mode, pre-filled', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getAllByLabelText('Edit collection')[0]);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByRole('textbox')).toHaveValue('Tech Articles');
  });

  it('delete icon opens DeleteCollectionDialog', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getAllByLabelText('Delete collection')[0]);

    await waitFor(() =>
      expect(screen.getByText('Delete collection?')).toBeInTheDocument(),
    );
  });

  it('refetches collections after collection create', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );
    expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'New Collection' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'New Collection' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(mockCollectionsApi.createCollection).toHaveBeenCalledWith(
        'test-access-token',
        'New Collection',
      ),
    );
    await waitFor(() =>
      expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(2),
    );
  });

  it('refetches collections after collection edit', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );
    expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByLabelText('Edit collection')[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Updated Collection' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockCollectionsApi.updateCollection).toHaveBeenCalledWith(
        'test-access-token',
        'col-1',
        'Updated Collection',
      ),
    );
    await waitFor(() =>
      expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(2),
    );
  });

  it('refetches collections after collection delete', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );
    expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByLabelText('Delete collection')[0]);
    await waitFor(() =>
      expect(screen.getByText('Delete collection?')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(mockCollectionsApi.deleteCollection).toHaveBeenCalledWith(
        'test-access-token',
        'col-1',
      ),
    );
    await waitFor(() =>
      expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(2),
    );
  });

  it('bumps refreshKey after bookmark create', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('refresh-key-col-1')).toHaveTextContent('0');

    fireEvent.click(screen.getByRole('button', { name: 'New Bookmark' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('URL'), {
      target: { value: 'https://example.com' },
    });
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New Bookmark Title' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(mockBookmarksApi.createBookmark).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('refresh-key-col-1')).toHaveTextContent('1'),
    );
  });

  it('bumps refreshKey after bookmark edit', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    const props = getAccordionProps('col-1');
    expect(props).toBeDefined();
    act(() => {
      props!.onEditBookmark(sampleBookmark);
    });

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Updated Title' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockBookmarksApi.updateBookmark).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('refresh-key-col-1')).toHaveTextContent('1'),
    );
  });

  it('bumps refreshKey after bookmark delete', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    const props = getAccordionProps('col-1');
    expect(props).toBeDefined();
    act(() => {
      props!.onDeleteBookmark(sampleBookmark);
    });

    await waitFor(() =>
      expect(screen.getByText('Delete bookmark?')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(mockBookmarksApi.deleteBookmark).toHaveBeenCalledWith(
        'test-access-token',
        'bm-1',
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('refresh-key-col-1')).toHaveTextContent('1'),
    );
  });

  it('keeps accordions mounted during a background refetch', async () => {
    render(<AllPage />);
    await waitFor(() =>
      expect(screen.getByText('Tech Articles')).toBeInTheDocument(),
    );

    let resolveRefetch!: (value: typeof sampleCollections) => void;
    mockCollectionsApi.fetchCollections.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefetch = resolve;
        }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'New Collection' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'New Collection' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(mockCollectionsApi.createCollection).toHaveBeenCalled(),
    );

    // During the in-flight refetch, accordions stay mounted (no skeleton teardown).
    expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    expect(document.querySelectorAll('.MuiSkeleton-root').length).toBe(0);

    resolveRefetch(sampleCollections);
    await waitFor(() =>
      expect(screen.getByTestId('refresh-key-col-1')).toHaveTextContent('1'),
    );
  });

  it('surfaces API errors via the global error context', async () => {
    mockCollectionsApi.fetchCollections.mockRejectedValue(
      new Error('network error'),
    );
    render(<AllPage />);
    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to load collections. Please try again.',
      ),
    );
  });
});
