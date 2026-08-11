import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useCallback, useState } from 'react';

interface DeleteBookmarkDialogProps {
  open: boolean;
  bookmarkTitle: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export default function DeleteBookmarkDialog({
  open,
  bookmarkTitle,
  onClose,
  onDelete,
}: DeleteBookmarkDialogProps) {
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
      <DialogTitle>Delete bookmark?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This will permanently delete the bookmark &apos;{bookmarkTitle}
          &apos;. This action cannot be undone.
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
