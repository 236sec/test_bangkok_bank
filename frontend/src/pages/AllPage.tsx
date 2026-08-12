import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AddIcon from '@mui/icons-material/Add';
import MenuItem from '@mui/material/MenuItem';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAccessToken } from '../auth';
import { useError } from '../error/useError';
import {
  createCollection,
  deleteCollection,
  fetchCollections,
  updateCollection,
  type Collection,
} from '../api/collections';
import {
  createBookmark,
  deleteBookmark,
  updateBookmark,
  type Bookmark,
} from '../api/bookmarks';
import CollectionDialog from '../components/collections/CollectionDialog';
import DeleteCollectionDialog from '../components/collections/DeleteCollectionDialog';
import BookmarkDialog from '../components/bookmarks/BookmarkDialog';
import DeleteBookmarkDialog from '../components/bookmarks/DeleteBookmarkDialog';
import CollectionAccordion, {
  type BookmarkSort,
} from '../components/all/CollectionAccordion';

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

function collectionSortToParams(option: SortOption): {
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
} {
  switch (option) {
    case 'newest':
      return { sortBy: 'createdAt', sortOrder: 'desc' };
    case 'oldest':
      return { sortBy: 'createdAt', sortOrder: 'asc' };
    case 'a-z':
      return { sortBy: 'name', sortOrder: 'asc' };
    case 'z-a':
      return { sortBy: 'name', sortOrder: 'desc' };
  }
}

function bookmarkSortToParams(option: SortOption): BookmarkSort {
  switch (option) {
    case 'newest':
      return { sortBy: 'createdAt', sortOrder: 'desc' };
    case 'oldest':
      return { sortBy: 'createdAt', sortOrder: 'asc' };
    case 'a-z':
      return { sortBy: 'title', sortOrder: 'asc' };
    case 'z-a':
      return { sortBy: 'title', sortOrder: 'desc' };
  }
}

function AllContent() {
  const getToken = useAccessToken();
  const { showError } = useError();
  const navigate = useNavigate();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collectionSort, setCollectionSort] = useState<SortOption>('newest');
  const [bookmarkSort, setBookmarkSort] = useState<SortOption>('newest');
  const [refreshKey, setRefreshKey] = useState(0);

  // Collection dialog state
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [deletingCollection, setDeletingCollection] =
    useState<Collection | null>(null);

  // Bookmark dialog state
  const [createBookmarkOpen, setCreateBookmarkOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(
    null,
  );

  const isFirstRender = useRef(true);
  const requestIdRef = useRef(0);

  const collectionSortParams = useMemo(
    () => collectionSortToParams(collectionSort),
    [collectionSort],
  );
  const bookmarkSortParams = useMemo(
    () => bookmarkSortToParams(bookmarkSort),
    [bookmarkSort],
  );

  const loadCollections = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const token = await getToken();
      const data = await fetchCollections(token, collectionSortParams);
      if (requestId === requestIdRef.current) {
        setCollections(data);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        showError('Failed to load collections. Please try again.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [getToken, collectionSortParams, showError]);

  const bumpRefreshKey = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  // Initial load on mount
  useEffect(() => {
    // eslint-disable-next-line -- intentional: data fetch on mount
    loadCollections();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when the collection sort changes (skip the initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadCollections();
  }, [collectionSortParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCollectionCreate = useCallback(
    async (name: string) => {
      try {
        const token = await getToken();
        await createCollection(token, name);
        await loadCollections();
        bumpRefreshKey();
      } catch (err) {
        showError('Failed to create collection. Please try again.');
        throw err;
      }
    },
    [getToken, loadCollections, bumpRefreshKey, showError],
  );

  const handleCollectionUpdate = useCallback(
    async (id: string, name: string) => {
      try {
        const token = await getToken();
        await updateCollection(token, id, name);
        await loadCollections();
        bumpRefreshKey();
      } catch (err) {
        showError('Failed to update collection. Please try again.');
        throw err;
      }
    },
    [getToken, loadCollections, bumpRefreshKey, showError],
  );

  const handleCollectionDelete = useCallback(async () => {
    if (!deletingCollection) return;
    try {
      const token = await getToken();
      await deleteCollection(token, deletingCollection.id);
      await loadCollections();
      bumpRefreshKey();
    } catch (err) {
      showError('Failed to delete collection. Please try again.');
      await loadCollections();
      throw err;
    }
  }, [
    getToken,
    deletingCollection,
    loadCollections,
    bumpRefreshKey,
    showError,
  ]);

  const handleBookmarkCreate = useCallback(
    async (payload: {
      url: string;
      title?: string;
      notes?: string;
      collectionId?: string;
    }) => {
      try {
        const token = await getToken();
        await createBookmark(token, payload);
        await loadCollections();
        bumpRefreshKey();
      } catch (err) {
        showError('Failed to create bookmark. Please try again.');
        throw err;
      }
    },
    [getToken, loadCollections, bumpRefreshKey, showError],
  );

  const handleBookmarkUpdate = useCallback(
    async (
      id: string,
      payload: {
        url: string;
        title: string;
        notes?: string;
        collectionId?: string;
      },
    ) => {
      try {
        const token = await getToken();
        await updateBookmark(token, id, payload);
        await loadCollections();
        bumpRefreshKey();
      } catch (err) {
        showError('Failed to update bookmark. Please try again.');
        throw err;
      }
    },
    [getToken, loadCollections, bumpRefreshKey, showError],
  );

  const handleBookmarkDelete = useCallback(async () => {
    if (!deletingBookmark) return;
    try {
      const token = await getToken();
      await deleteBookmark(token, deletingBookmark.id);
      await loadCollections();
      bumpRefreshKey();
    } catch (err) {
      showError('Failed to delete bookmark. Please try again.');
      await loadCollections();
      throw err;
    }
  }, [getToken, deletingBookmark, loadCollections, bumpRefreshKey, showError]);

  const handleCollectionSortChange = useCallback((e: SelectChangeEvent) => {
    setCollectionSort(e.target.value as SortOption);
  }, []);

  const handleBookmarkSortChange = useCallback((e: SelectChangeEvent) => {
    setBookmarkSort(e.target.value as SortOption);
  }, []);

  const isEmpty = !isLoading && collections.length === 0;

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        All
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateCollectionOpen(true)}
        >
          New Collection
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateBookmarkOpen(true)}
        >
          New Bookmark
        </Button>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="collections-sort-label">Collections sort</InputLabel>
          <Select
            labelId="collections-sort-label"
            label="Collections sort"
            value={collectionSort}
            onChange={handleCollectionSortChange}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            <MenuItem value="a-z">A–Z</MenuItem>
            <MenuItem value="z-a">Z–A</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="bookmarks-sort-label">Bookmarks sort</InputLabel>
          <Select
            labelId="bookmarks-sort-label"
            label="Bookmarks sort"
            value={bookmarkSort}
            onChange={handleBookmarkSortChange}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            <MenuItem value="a-z">A–Z</MenuItem>
            <MenuItem value="z-a">Z–A</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading && collections.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={72}
              sx={{ borderRadius: 'var(--radius-md)' }}
            />
          ))}
        </Box>
      ) : isEmpty ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            py: 8,
          }}
        >
          <FolderOpenIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No collections yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            Create your first collection to start organizing your bookmarks.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateCollectionOpen(true)}
          >
            Create your first collection
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {collections.map((collection) => (
            <CollectionAccordion
              key={collection.id}
              collection={collection}
              bookmarkSort={bookmarkSortParams}
              refreshKey={refreshKey}
              onEditCollection={() => setEditingCollection(collection)}
              onDeleteCollection={() => setDeletingCollection(collection)}
              onEditBookmark={setEditingBookmark}
              onDeleteBookmark={setDeletingBookmark}
              onBookmarkClick={(bookmark) =>
                navigate(`/bookmarks/${bookmark.id}`)
              }
              onCreateBookmark={() => setCreateBookmarkOpen(true)}
            />
          ))}
        </Box>
      )}

      {/* Collection dialogs */}
      <CollectionDialog
        open={createCollectionOpen}
        onClose={() => setCreateCollectionOpen(false)}
        onCreate={handleCollectionCreate}
      />

      {editingCollection && (
        <CollectionDialog
          open={true}
          onClose={() => setEditingCollection(null)}
          onSave={handleCollectionUpdate}
          collection={{
            id: editingCollection.id,
            name: editingCollection.name,
          }}
        />
      )}

      {deletingCollection && (
        <DeleteCollectionDialog
          open={true}
          collectionName={deletingCollection.name}
          onClose={() => setDeletingCollection(null)}
          onDelete={handleCollectionDelete}
        />
      )}

      {/* Bookmark dialogs */}
      <BookmarkDialog
        open={createBookmarkOpen}
        onClose={() => setCreateBookmarkOpen(false)}
        onCreate={handleBookmarkCreate}
      />

      {editingBookmark && (
        <BookmarkDialog
          open={true}
          onClose={() => setEditingBookmark(null)}
          onSave={handleBookmarkUpdate}
          bookmark={{
            id: editingBookmark.id,
            url: editingBookmark.url,
            title: editingBookmark.title,
            notes: editingBookmark.notes,
            collectionId: editingBookmark.collectionId,
          }}
        />
      )}

      {deletingBookmark && (
        <DeleteBookmarkDialog
          open={true}
          bookmarkTitle={deletingBookmark.title}
          onClose={() => setDeletingBookmark(null)}
          onDelete={handleBookmarkDelete}
        />
      )}
    </Box>
  );
}

export default function AllPage() {
  return <AllContent />;
}
