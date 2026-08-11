import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAccessToken } from '../auth';
import { useError } from '../error/useError';
import { fetchCollection, type Collection } from '../api/collections';

function CollectionDetailContent() {
  const { id } = useParams<{ id: string }>();
  const getToken = useAccessToken();
  const { showError } = useError();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const collectionId = id; // capture for TS narrowing inside async closure

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const token = await getToken();
        const data = await fetchCollection(token, collectionId);
        if (!cancelled) {
          setCollection(data);
          setIsNotFound(false);
        }
      } catch (err) {
        if (!cancelled) {
          // 404 from fetchCollection means the collection doesn't exist
          // (either deleted or doesn't belong to this user)
          if (err instanceof Error && err.message.includes('404')) {
            setIsNotFound(true);
          } else {
            showError('Failed to load collection. Please try again.');
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

  const bookmarkCount = collection?._count?.bookmarks ?? 0;
  const createdAt = collection
    ? new Date(collection.createdAt).toLocaleDateString()
    : '';
  const updatedAt = collection
    ? new Date(collection.updatedAt).toLocaleDateString()
    : '';

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Button
        component={Link}
        to="/collections"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Collections
      </Button>

      {isLoading ? (
        <Card variant="outlined">
          <CardContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="40%" />
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
            Collection not found
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            This collection may have been deleted or you may not have access to
            it.
          </Typography>
        </Box>
      ) : collection ? (
        <>
          <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
            {collection.name}
          </Typography>

          <Card variant="outlined">
            <CardContent
              sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
            >
              <Typography variant="body1" color="text.secondary">
                {bookmarkCount === 1
                  ? '1 bookmark'
                  : `${bookmarkCount} bookmarks`}
              </Typography>

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
        </>
      ) : null}
    </Box>
  );
}

export default function CollectionDetailPage() {
  return <CollectionDetailContent />;
}
