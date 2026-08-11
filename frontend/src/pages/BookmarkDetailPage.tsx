import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LanguageIcon from '@mui/icons-material/Language';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAccessToken } from '../auth';
import { useError } from '../error/useError';
import {
  deleteBookmark,
  fetchBookmark,
  updateBookmark,
  type Bookmark,
} from '../api/bookmarks';
import BookmarkDialog from '../components/bookmarks/BookmarkDialog';
import DeleteBookmarkDialog from '../components/bookmarks/DeleteBookmarkDialog';

function BookmarkDetailContent() {
  const { id } = useParams<{ id: string }>();
  const getToken = useAccessToken();
  const { showError } = useError();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const bookmarkId = id;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const token = await getToken();
        const data = await fetchBookmark(token, bookmarkId);
        if (!cancelled) {
          setBookmark(data);
          setIsNotFound(false);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof Error && err.message.includes('404')) {
            setIsNotFound(true);
          } else {
            showError('Failed to load bookmark. Please try again.');
            setIsNotFound(true);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, getToken, showError]);

  const handleUpdate = async (
    bookmarkId: string,
    payload: {
      url: string;
      title: string;
      notes?: string;
      collectionId?: string;
    },
  ) => {
    try {
      const token = await getToken();
      const updated = await updateBookmark(token, bookmarkId, payload);
      setBookmark(updated);
      setEditDialogOpen(false);
    } catch (err) {
      showError('Failed to update bookmark. Please try again.');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!bookmark) return;
    try {
      const token = await getToken();
      await deleteBookmark(token, bookmark.id);
      setDeleteDialogOpen(false);
      // Navigate back handled by parent or we could use navigate
      window.history.back();
    } catch (err) {
      showError('Failed to delete bookmark. Please try again.');
      throw err;
    }
  };

  const createdAt = bookmark
    ? new Date(bookmark.createdAt).toLocaleDateString()
    : '';
  const updatedAt = bookmark
    ? new Date(bookmark.updatedAt).toLocaleDateString()
    : '';

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Button
        component={Link}
        to="/bookmarks"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Bookmarks
      </Button>

      {isLoading ? (
        <Card variant="outlined">
          <CardContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="30%" />
          </CardContent>
        </Card>
      ) : isNotFound ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            py: 8,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Bookmark not found
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            This bookmark may have been deleted or you may not have access to
            it.
          </Typography>
        </Box>
      ) : bookmark ? (
        <>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent
              sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {bookmark.favicon ? (
                  <Box
                    component="img"
                    src={bookmark.favicon}
                    alt=""
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-xs)',
                    }}
                  />
                ) : (
                  <LanguageIcon
                    sx={{ fontSize: 32, color: 'text.secondary' }}
                  />
                )}
                <Typography variant="h6">{bookmark.title}</Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  component="a"
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontFamily: 'var(--font-mono)',
                    color: 'primary.main',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {bookmark.url}
                  <OpenInNewIcon sx={{ fontSize: 14 }} />
                </Typography>
              </Box>

              {bookmark.notes && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">{bookmark.notes}</Typography>
                </Box>
              )}

              {bookmark.collection && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Collection
                  </Typography>
                  <Chip
                    label={bookmark.collection.name}
                    size="small"
                    component={Link}
                    to={`/collections/${bookmark.collection.id}`}
                    clickable
                  />
                </Box>
              )}

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">{createdAt}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last updated
                </Typography>
                <Typography variant="body1">{updatedAt}</Typography>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setEditDialogOpen(true)}>
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Box>

          {/* Edit dialog */}
          {editDialogOpen && (
            <BookmarkDialog
              open={true}
              onClose={() => setEditDialogOpen(false)}
              onSave={handleUpdate}
              bookmark={{
                id: bookmark.id,
                url: bookmark.url,
                title: bookmark.title,
                notes: bookmark.notes,
                collectionId: bookmark.collectionId,
              }}
            />
          )}

          {/* Delete dialog */}
          {deleteDialogOpen && (
            <DeleteBookmarkDialog
              open={true}
              bookmarkTitle={bookmark.title}
              onClose={() => setDeleteDialogOpen(false)}
              onDelete={handleDelete}
            />
          )}
        </>
      ) : null}
    </Box>
  );
}

export default function BookmarkDetailPage() {
  return <BookmarkDetailContent />;
}
