import { Box } from '@mui/material';
import CollectionCard from './CollectionCard';
import type { Collection } from '../../api/collections';

interface CollectionListProps {
  collections: Collection[];
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onClick: (collection: Collection) => void;
}

export default function CollectionList({
  collections,
  onEdit,
  onDelete,
  onClick,
}: CollectionListProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onEdit={() => onEdit(collection)}
          onDelete={() => onDelete(collection)}
          onClick={() => onClick(collection)}
        />
      ))}
    </Box>
  );
}
