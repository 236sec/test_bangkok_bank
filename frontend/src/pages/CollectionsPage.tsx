import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
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
import CollectionList from '../components/collections/CollectionList';
import CollectionDialog from '../components/collections/CollectionDialog';
import DeleteCollectionDialog from '../components/collections/DeleteCollectionDialog';

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

function sortOptionToParams(option: SortOption): {
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

function CollectionsContent() {
  const getToken = useAccessToken();
  const { showError } = useError();
  const navigate = useNavigate();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [deletingCollection, setDeletingCollection] =
    useState<Collection | null>(null);

  // Debounce + stale-request tracking
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const requestIdRef = useRef(0);
  const isFirstRender = useRef(true);

  const sortParams = useMemo(() => sortOptionToParams(sort), [sort]);

  const loadCollections = useCallback(
    async (name?: string) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        const token = await getToken();
        const params = { ...sortParams, ...(name ? { name } : {}) };
        const data = await fetchCollections(token, params);
        // Only apply if this is still the latest request
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
    },
    [getToken, showError, sortParams],
  );

  // Initial load on mount
  useEffect(() => {
    // eslint-disable-next-line -- intentional: data fetch on mount
    loadCollections();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when sort changes (skip initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadCollections(search || undefined);
  }, [sort]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadCollections(search || undefined);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, loadCollections]);

  const handleCreate = useCallback(
    async (name: string) => {
      try {
        const token = await getToken();
        await createCollection(token, name);
        await loadCollections(search || undefined);
      } catch (err) {
        showError('Failed to create collection. Please try again.');
        throw err; // rethrow so dialog keeps state
      }
    },
    [getToken, loadCollections, search, showError],
  );

  const handleUpdate = useCallback(
    async (id: string, name: string) => {
      try {
        const token = await getToken();
        await updateCollection(token, id, name);
        await loadCollections(search || undefined);
      } catch (err) {
        showError('Failed to update collection. Please try again.');
        throw err; // rethrow so dialog keeps state
      }
    },
    [getToken, loadCollections, search, showError],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingCollection) return;
    try {
      const token = await getToken();
      await deleteCollection(token, deletingCollection.id);
      // Optimistic: remove from list
      setCollections((prev) =>
        prev.filter((c) => c.id !== deletingCollection.id),
      );
    } catch (err) {
      showError('Failed to delete collection. Please try again.');
      // Refresh list to restore if optimistic removal failed
      await loadCollections(search || undefined);
      throw err; // rethrow so dialog keeps state
    }
  }, [getToken, deletingCollection, loadCollections, search, showError]);

  const handleSortChange = useCallback((e: SelectChangeEvent) => {
    setSort(e.target.value as SortOption);
  }, []);

  const isEmpty = !isLoading && collections.length === 0 && !search;
  const isNoResults = !isLoading && collections.length === 0 && !!search;

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Collections
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          placeholder="Search collections…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: <SearchIcon fontSize="small" color="action" />,
            },
          }}
          sx={{ flex: 1, minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="sort-label">Sort</InputLabel>
          <Select
            labelId="sort-label"
            label="Sort"
            value={sort}
            onChange={handleSortChange}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            <MenuItem value="a-z">A–Z</MenuItem>
            <MenuItem value="z-a">Z–A</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Collection
        </Button>
      </Box>

      {isLoading ? (
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
            onClick={() => setCreateDialogOpen(true)}
          >
            Create your first collection
          </Button>
        </Box>
      ) : isNoResults ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            py: 8,
          }}
        >
          <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No collections found
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            No collections match &ldquo;{search}&rdquo;. Try a different search
            term.
          </Typography>
        </Box>
      ) : (
        <CollectionList
          collections={collections}
          onEdit={setEditingCollection}
          onDelete={setDeletingCollection}
          onClick={(collection) => navigate(`/collections/${collection.id}`)}
        />
      )}

      {/* Create dialog */}
      <CollectionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreate}
      />

      {/* Edit dialog */}
      {editingCollection && (
        <CollectionDialog
          open={true}
          onClose={() => setEditingCollection(null)}
          onSave={handleUpdate}
          collection={{
            id: editingCollection.id,
            name: editingCollection.name,
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingCollection && (
        <DeleteCollectionDialog
          open={true}
          collectionName={deletingCollection.name}
          onClose={() => setDeletingCollection(null)}
          onDelete={handleDelete}
        />
      )}
    </Box>
  );
}

export default function CollectionsPage() {
  return <CollectionsContent />;
}
