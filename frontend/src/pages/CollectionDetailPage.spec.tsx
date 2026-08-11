import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ErrorProvider } from '../error/ErrorContext';
import CollectionDetailPage from './CollectionDetailPage';

const { mockAuth, mockFetchCollection } = vi.hoisted(() => ({
  mockAuth: {
    isLoading: false,
    isAuthenticated: true,
    user: null,
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAccessTokenSilently: vi.fn().mockResolvedValue('test-access-token'),
  },
  mockFetchCollection: vi.fn(),
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth,
}));

vi.mock('../api/collections', () => ({
  fetchCollection: mockFetchCollection,
  fetchCollections: vi.fn(),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  patchCollection: vi.fn(),
}));

describe('CollectionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isLoading = false;
    mockAuth.isAuthenticated = true;
  });

  it('renders collection details after fetch', async () => {
    mockFetchCollection.mockResolvedValue({
      id: 'col-1',
      name: 'Tech Articles',
      ownerId: 'user-1',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      _count: { bookmarks: 5 },
    });

    render(
      <ErrorProvider>
        <MemoryRouter initialEntries={['/collections/col-1']}>
          <Routes>
            <Route path="/collections/:id" element={<CollectionDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    });

    expect(screen.getByText('5 bookmarks')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to Collections' }),
    ).toBeInTheDocument();
  });

  it('shows skeleton loader while fetching', () => {
    let resolvePromise!: (value: unknown) => void;
    mockFetchCollection.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(
      <ErrorProvider>
        <MemoryRouter initialEntries={['/collections/col-1']}>
          <Routes>
            <Route path="/collections/:id" element={<CollectionDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ErrorProvider>,
    );

    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);

    // Cleanup
    resolvePromise({
      id: 'col-1',
      name: 'Tech Articles',
      ownerId: 'user-1',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      _count: { bookmarks: 5 },
    });
  });

  it('shows bookmark count of 0 when _count is undefined', async () => {
    mockFetchCollection.mockResolvedValue({
      id: 'col-2',
      name: 'Empty Collection',
      ownerId: 'user-1',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });

    render(
      <ErrorProvider>
        <MemoryRouter initialEntries={['/collections/col-2']}>
          <Routes>
            <Route path="/collections/:id" element={<CollectionDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ErrorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Empty Collection')).toBeInTheDocument();
    });

    expect(screen.getByText('0 bookmarks')).toBeInTheDocument();
  });
});
