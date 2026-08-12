import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LanguageIcon from '@mui/icons-material/Language';
import type { Bookmark } from '../../api/bookmarks';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export default function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onClick,
}: BookmarkCardProps) {
  const urlSnippet =
    bookmark.url.length > 50 ? `${bookmark.url.slice(0, 50)}…` : bookmark.url;

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {bookmark.favicon ? (
              <Box
                component="img"
                src={bookmark.favicon}
                alt=""
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--radius-xs)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <LanguageIcon
                sx={{ fontSize: 24, color: 'text.secondary', flexShrink: 0 }}
              />
            )}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 300,
                }}
              >
                {bookmark.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: 'var(--font-mono)' }}
              >
                {urlSnippet}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {bookmark.collection && (
              <Chip label={bookmark.collection.name} size="small" />
            )}
            <IconButton
              aria-label="Edit bookmark"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Delete bookmark"
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
