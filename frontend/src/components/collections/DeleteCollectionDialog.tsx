import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useCallback, useState } from 'react';

interface DeleteCollectionDialogProps {
  open: boolean;
  collectionName: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export default function DeleteCollectionDialog({
  open,
  collectionName,
  onClose,
  onDelete,
}: DeleteCollectionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      // Error is surfaced via useError() in the parent — keep dialog open
      setIsDeleting(false);
    }
  }, [onDelete, onClose]);

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 'var(--radius-lg)' },
        },
        transition: {
          onEntered: () => setIsDeleting(false),
        },
      }}
    >
      <DialogTitle>Delete collection?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This will delete the collection &apos;{collectionName}&apos;.
          Bookmarks in this collection will become uncategorized.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
