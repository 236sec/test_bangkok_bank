import { Box } from '@mui/material';
import BookmarkCard from './BookmarkCard';
import type { Bookmark } from '../../api/bookmarks';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onClick: (bookmark: Bookmark) => void;
  showCollectionChip?: boolean;
}

export default function BookmarkList({
  bookmarks,
  onEdit,
  onDelete,
  onClick,
  showCollectionChip = true,
}: BookmarkListProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          showCollectionChip={showCollectionChip}
          onEdit={() => onEdit(bookmark)}
          onDelete={() => onDelete(bookmark)}
          onClick={() => onClick(bookmark)}
        />
      ))}
    </Box>
  );
}
