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
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAccessToken } from '../auth';
import { useError } from '../error/useError';
import {
  createBookmark,
  deleteBookmark,
  fetchBookmarks,
  updateBookmark,
  type Bookmark,
} from '../api/bookmarks';
import BookmarkList from '../components/bookmarks/BookmarkList';
import BookmarkDialog from '../components/bookmarks/BookmarkDialog';
import DeleteBookmarkDialog from '../components/bookmarks/DeleteBookmarkDialog';

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

function sortOptionToParams(option: SortOption): {
  sortBy: 'title' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
} {
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

function BookmarksContent() {
  const getToken = useAccessToken();
  const { showError } = useError();
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [titleSearch, setTitleSearch] = useState('');
  const [urlSearch, setUrlSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(
    null,
  );

  // Debounce + stale-request tracking
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const requestIdRef = useRef(0);
  const isFirstRender = useRef(true);

  const sortParams = useMemo(() => sortOptionToParams(sort), [sort]);

  const loadBookmarks = useCallback(
    async (title?: string, url?: string) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        const token = await getToken();
        const params = {
          ...sortParams,
          ...(title ? { title } : {}),
          ...(url ? { url } : {}),
        };
        const data = await fetchBookmarks(token, params);
        if (requestId === requestIdRef.current) {
          setBookmarks(data);
        }
      } catch {
        if (requestId === requestIdRef.current) {
          showError('Failed to load bookmarks. Please try again.');
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
    loadBookmarks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when sort changes (skip initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadBookmarks(titleSearch || undefined, urlSearch || undefined);
  }, [sort]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced combined search — fires 300ms after last change to either field
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadBookmarks(titleSearch || undefined, urlSearch || undefined);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [titleSearch, urlSearch, loadBookmarks]);

  const handleCreate = useCallback(
    async (payload: {
      url: string;
      title?: string;
      notes?: string;
      collectionId?: string;
    }) => {
      try {
        const token = await getToken();
        await createBookmark(token, payload);
        await loadBookmarks(titleSearch || undefined, urlSearch || undefined);
      } catch (err) {
        showError('Failed to create bookmark. Please try again.');
        throw err;
      }
    },
    [getToken, loadBookmarks, titleSearch, urlSearch, showError],
  );

  const handleUpdate = useCallback(
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
        await loadBookmarks(titleSearch || undefined, urlSearch || undefined);
      } catch (err) {
        showError('Failed to update bookmark. Please try again.');
        throw err;
      }
    },
    [getToken, loadBookmarks, titleSearch, urlSearch, showError],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingBookmark) return;
    try {
      const token = await getToken();
      await deleteBookmark(token, deletingBookmark.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== deletingBookmark.id));
    } catch (err) {
      showError('Failed to delete bookmark. Please try again.');
      await loadBookmarks(titleSearch || undefined, urlSearch || undefined);
      throw err;
    }
  }, [
    getToken,
    deletingBookmark,
    loadBookmarks,
    titleSearch,
    urlSearch,
    showError,
  ]);

  const handleSortChange = useCallback((e: SelectChangeEvent) => {
    setSort(e.target.value as SortOption);
  }, []);

  const isEmpty =
    !isLoading && bookmarks.length === 0 && !titleSearch && !urlSearch;
  const isNoResults =
    !isLoading && bookmarks.length === 0 && (!!titleSearch || !!urlSearch);

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Bookmarks
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
          placeholder="Search by title…"
          value={titleSearch}
          onChange={(e) => setTitleSearch(e.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: <SearchIcon fontSize="small" color="action" />,
            },
          }}
          sx={{ flex: 1, minWidth: 180 }}
        />

        <TextField
          placeholder="Search by URL…"
          value={urlSearch}
          onChange={(e) => setUrlSearch(e.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: <SearchIcon fontSize="small" color="action" />,
            },
          }}
          sx={{ flex: 1, minWidth: 180 }}
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
          New Bookmark
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
          <BookmarkAddIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No bookmarks yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            Save your first link to start building your collection.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Save your first link
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
            No bookmarks found
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            No bookmarks match your search. Try different search terms.
          </Typography>
        </Box>
      ) : (
        <BookmarkList
          bookmarks={bookmarks}
          onEdit={setEditingBookmark}
          onDelete={setDeletingBookmark}
          onClick={(bookmark) => navigate(`/bookmarks/${bookmark.id}`)}
        />
      )}

      {/* Create dialog */}
      <BookmarkDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreate}
      />

      {/* Edit dialog */}
      {editingBookmark && (
        <BookmarkDialog
          open={true}
          onClose={() => setEditingBookmark(null)}
          onSave={handleUpdate}
          bookmark={{
            id: editingBookmark.id,
            url: editingBookmark.url,
            title: editingBookmark.title,
            notes: editingBookmark.notes,
            collectionId: editingBookmark.collectionId,
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingBookmark && (
        <DeleteBookmarkDialog
          open={true}
          bookmarkTitle={deletingBookmark.title}
          onClose={() => setDeletingBookmark(null)}
          onDelete={handleDelete}
        />
      )}
    </Box>
  );
}

export default function BookmarksPage() {
  return <BookmarksContent />;
}
