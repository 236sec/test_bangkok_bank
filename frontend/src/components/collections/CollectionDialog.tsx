import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useCallback, useState } from 'react';

interface CreateModeProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onSave?: never;
  collection?: never;
}

interface EditModeProps {
  open: boolean;
  onClose: () => void;
  onSave: (id: string, name: string) => Promise<void>;
  collection: { id: string; name: string };
  onCreate?: never;
}

type CollectionDialogProps = CreateModeProps | EditModeProps;

export default function CollectionDialog(props: CollectionDialogProps) {
  const { open, onClose } = props;
  const isEditMode = 'collection' in props && props.collection !== undefined;

  const initialName = isEditMode ? props.collection.name : '';
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  const handleEntered = useCallback(() => {
    setName(initialName);
    setIsSubmitting(false);
  }, [initialName]);

  const isNameValid = name.trim().length > 0 && name.trim().length <= 100;
  const isNameChanged = name.trim() !== initialName.trim();
  const isPrimaryDisabled =
    !isNameValid || (isEditMode && !isNameChanged) || isSubmitting;

  const handleSubmit = useCallback(async () => {
    if (isPrimaryDisabled) return;

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await props.onSave(props.collection.id, name.trim());
      } else {
        await props.onCreate(name.trim());
      }
      onClose();
    } catch {
      // Parent rethrows after showing error — reset submitting state
      // but keep dialog open so user can retry
      setIsSubmitting(false);
    }
  }, [isPrimaryDisabled, name, isEditMode, props, onClose]);

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 'var(--radius-lg)' },
        },
        transition: {
          onEntered: handleEntered,
        },
      }}
    >
      <DialogTitle>
        {isEditMode ? 'Edit Collection' : 'New Collection'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Collection name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          error={name.length > 100}
          helperText={
            name.length > 100
              ? 'Name must be 100 characters or fewer'
              : undefined
          }
          slotProps={{
            htmlInput: {
              maxLength: 100,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && !isPrimaryDisabled) {
                  handleSubmit();
                }
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isPrimaryDisabled}
        >
          {isEditMode ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
