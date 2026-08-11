import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  IconButton,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Collection } from '../../api/collections';

interface CollectionCardProps {
  collection: Collection;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export default function CollectionCard({
  collection,
  onEdit,
  onDelete,
  onClick,
}: CollectionCardProps) {
  const bookmarkCount = collection._count?.bookmarks ?? 0;

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick}>
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6">{collection.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {bookmarkCount === 1
                ? '1 bookmark'
                : `${bookmarkCount} bookmarks`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              aria-label="Edit collection"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Delete collection"
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
