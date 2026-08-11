import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorProvider } from '../error/ErrorContext';
import CollectionsPage from './CollectionsPage';

const { mockAuth, mockCollectionsApi, mockNavigate } = vi.hoisted(() => ({
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
  mockNavigate: vi.fn(),
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

vi.mock('../api/collections', () => mockCollectionsApi);

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

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
  {
    id: 'col-3',
    name: 'Travel',
    ownerId: 'user-1',
    createdAt: '2025-01-04T00:00:00.000Z',
    updatedAt: '2025-01-04T00:00:00.000Z',
  },
];

describe('CollectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isLoading = false;
    mockAuth.isAuthenticated = true;
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
  });

  it('shows skeleton loaders while fetching', () => {
    // Don't resolve fetchCollections to keep it in loading state
    let resolvePromise!: (value: typeof sampleCollections) => void;
    mockCollectionsApi.fetchCollections.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    // MUI Skeleton uses role="progressbar" or we can check for aria-busy
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);

    // Cleanup
    resolvePromise(sampleCollections);
  });

  it('shows collection cards after load', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
      expect(screen.getByText('Recipes')).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();
    });
  });

  it('shows empty state when no collections', async () => {
    mockCollectionsApi.fetchCollections.mockResolvedValue([]);

    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('No collections yet')).toBeInTheDocument();
    });
  });

  it('opens create dialog on "New Collection" click', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'New Collection' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('opens edit dialog on edit icon click, pre-filled with collection name', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    });

    // Find the edit button for the first collection
    const editButtons = screen.getAllByLabelText('Edit collection');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const textbox = screen.getByRole('textbox');
    expect(textbox).toHaveValue('Tech Articles');
  });

  it('opens delete confirmation dialog on delete icon click', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete collection');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete collection?')).toBeInTheDocument();
      expect(
        screen.getByText(
          "This will delete the collection 'Tech Articles'. Bookmarks in this collection will become uncategorized.",
        ),
      ).toBeInTheDocument();
    });
  });

  it('refreshes list after successful create', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    });

    // Initial fetch called once
    expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(1);

    // Open create dialog
    fireEvent.click(screen.getByRole('button', { name: 'New Collection' }));

    // Fill in name and submit
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'New Collection' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      // Should be called again after create
      expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(2);
    });
  });

  it('removes collection from list after successful delete', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete collection');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete collection?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mockCollectionsApi.deleteCollection).toHaveBeenCalledWith(
        'test-access-token',
        'col-1',
      );
      // List should refresh
      expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledTimes(2);
    });
  });

  it('search input filters collections', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search collections…');
    fireEvent.change(searchInput, { target: { value: 'Tech' } });

    // Debounced — wait for the debounce
    await waitFor(
      () => {
        expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledWith(
          'test-access-token',
          expect.objectContaining({ name: 'Tech' }),
        );
      },
      { timeout: 500 },
    );
  });

  it('sort control changes order', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    });

    // Default sort: createdAt desc (Newest)
    expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    );

    // Change sort to A-Z
    const sortSelect = screen.getByRole('combobox', { name: 'Sort' });
    fireEvent.mouseDown(sortSelect);

    // Select "A–Z" from the dropdown
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByText('A–Z'));

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockCollectionsApi.fetchCollections).toHaveBeenCalledWith(
          'test-access-token',
          expect.objectContaining({
            sortBy: 'name',
            sortOrder: 'asc',
          }),
        );
      },
      { timeout: 500 },
    );
  });

  it('navigates to collection detail on card click', async () => {
    render(
      <ErrorProvider>
        <CollectionsPage />
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    });

    // Click on the card for Tech Articles
    fireEvent.click(screen.getByText('Tech Articles'));

    expect(mockNavigate).toHaveBeenCalledWith('/collections/col-1');
  });
});
