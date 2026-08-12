import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCollectionBookmarks, type Bookmark } from '../../api/bookmarks';
import type { Collection } from '../../api/collections';
import { useAccessToken } from '../../auth';
import { useError } from '../../error/useError';
import BookmarkList from '../bookmarks/BookmarkList';

export interface BookmarkSort {
  sortBy: 'title' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

interface CollectionAccordionProps {
  collection: Collection;
  bookmarkSort: BookmarkSort;
  refreshKey: number;
  onEditCollection: () => void;
  onDeleteCollection: () => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
  onBookmarkClick: (bookmark: Bookmark) => void;
  onCreateBookmark: () => void;
}

export default function CollectionAccordion({
  collection,
  bookmarkSort,
  refreshKey,
  onEditCollection,
  onDeleteCollection,
  onEditBookmark,
  onDeleteBookmark,
  onBookmarkClick,
  onCreateBookmark,
}: CollectionAccordionProps) {
  const getToken = useAccessToken();
  const { showError } = useError();

  const [expanded, setExpanded] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);
  const [loading, setLoading] = useState(false);

  const hasLoadedRef = useRef(false);
  const prevSortKeyRef = useRef(
    `${bookmarkSort.sortBy}:${bookmarkSort.sortOrder}`,
  );
  const prevRefreshKeyRef = useRef(refreshKey);

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchCollectionBookmarks(
        token,
        collection.id,
        bookmarkSort,
      );
      setBookmarks(data);
      hasLoadedRef.current = true;
    } catch {
      // Keep previous bookmarks (or empty state) — surface the error globally.
      showError('Failed to load bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getToken, collection.id, bookmarkSort, showError]);

  useEffect(() => {
    if (!expanded) return;

    const sortKey = `${bookmarkSort.sortBy}:${bookmarkSort.sortOrder}`;
    const sortChanged = prevSortKeyRef.current !== sortKey;
    const refreshChanged = prevRefreshKeyRef.current !== refreshKey;

    prevSortKeyRef.current = sortKey;
    prevRefreshKeyRef.current = refreshKey;

    if (!hasLoadedRef.current) {
      loadBookmarks();
    } else if (sortChanged || refreshChanged) {
      loadBookmarks();
    }
  }, [expanded, bookmarkSort, refreshKey, loadBookmarks]);

  const handleToggle = useCallback(
    (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded);
    },
    [],
  );

  const count = collection._count?.bookmarks ?? 0;

  return (
    <Accordion expanded={expanded} onChange={handleToggle}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1">{collection.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {count} bookmarks
            </Typography>
          </Box>
          <IconButton
            size="small"
            aria-label="Edit collection"
            onClick={(e) => {
              e.stopPropagation();
              onEditCollection();
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Delete collection"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCollection();
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {loading ? (
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
        ) : bookmarks && bookmarks.length > 0 ? (
          <BookmarkList
            bookmarks={bookmarks}
            showCollectionChip={false}
            onEdit={onEditBookmark}
            onDelete={onDeleteBookmark}
            onClick={onBookmarkClick}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              py: 4,
            }}
          >
            <BookmarkAddIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              No bookmarks in this collection yet
            </Typography>
            <Button
              variant="contained"
              startIcon={<BookmarkAddIcon />}
              onClick={onCreateBookmark}
            >
              Add bookmark
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
