import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { fetchCollections, type Collection } from '../../api/collections';
import { useAccessToken } from '../../auth';
import { useError } from '../../error/useError';

interface CreateModeProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    url: string;
    title?: string;
    notes?: string;
    collectionId?: string;
  }) => Promise<void>;
  onSave?: never;
  bookmark?: never;
}

interface EditModeProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    payload: {
      url: string;
      title: string;
      notes?: string;
      collectionId?: string;
    },
  ) => Promise<void>;
  bookmark: {
    id: string;
    url: string;
    title: string;
    notes: string | null;
    collectionId: string | null;
  };
  onCreate?: never;
}

type BookmarkDialogProps = CreateModeProps | EditModeProps;

export default function BookmarkDialog(props: BookmarkDialogProps) {
  const { open, onClose } = props;
  const isEditMode = 'bookmark' in props && props.bookmark !== undefined;

  const getToken = useAccessToken();
  const { showError } = useError();

  const initialUrl = isEditMode ? props.bookmark.url : '';
  const initialTitle = isEditMode ? props.bookmark.title : '';
  const initialNotes = isEditMode ? (props.bookmark.notes ?? '') : '';
  const initialCollectionId = isEditMode
    ? (props.bookmark.collectionId ?? '')
    : '';

  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);
  const [collectionId, setCollectionId] = useState(initialCollectionId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collection autocomplete state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  // Validation
  const [urlError, setUrlError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [notesError, setNotesError] = useState('');

  // Reset form when dialog opens
  const handleEntered = useCallback(() => {
    setUrl(initialUrl);
    setTitle(initialTitle);
    setNotes(initialNotes);
    setCollectionId(initialCollectionId);
    setIsSubmitting(false);
    setUrlError('');
    setTitleError('');
    setNotesError('');
  }, [initialUrl, initialTitle, initialNotes, initialCollectionId]);

  // Load collections for autocomplete
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadCollections() {
      setCollectionsLoading(true);
      try {
        const token = await getToken();
        const data = await fetchCollections(token);
        if (!cancelled) {
          setCollections(data);
        }
      } catch {
        if (!cancelled) {
          showError('Failed to load collections');
        }
      } finally {
        if (!cancelled) {
          setCollectionsLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      cancelled = true;
    };
  }, [open, getToken, showError]);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError('URL is required');
      return false;
    }
    try {
      new URL(value);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const validateTitle = (value: string): boolean => {
    if (isEditMode && !value.trim()) {
      setTitleError('Title is required');
      return false;
    }
    if (value.length > 200) {
      setTitleError('Title must be 200 characters or fewer');
      return false;
    }
    setTitleError('');
    return true;
  };

  const validateNotes = (value: string): boolean => {
    if (value.length > 500) {
      setNotesError('Notes must be 500 characters or fewer');
      return false;
    }
    setNotesError('');
    return true;
  };

  const hasChanged =
    isEditMode &&
    url.trim() === initialUrl &&
    title.trim() === initialTitle &&
    notes.trim() === initialNotes &&
    (collectionId || '') === initialCollectionId;

  // Actually, simpler logic:
  let primaryDisabled = isSubmitting;
  if (!isEditMode) {
    primaryDisabled = primaryDisabled || !url.trim() || !!urlError;
  } else {
    primaryDisabled =
      primaryDisabled ||
      !url.trim() ||
      !title.trim() ||
      (hasChanged as boolean) ||
      !!urlError ||
      !!titleError ||
      !!notesError;
  }

  const handleSubmit = useCallback(async () => {
    if (!validateUrl(url)) return;
    if (isEditMode && !validateTitle(title)) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        url: url.trim(),
      };

      if (title.trim()) {
        payload.title = title.trim();
      }

      if (notes.trim()) {
        payload.notes = notes.trim();
      }

      if (collectionId) {
        payload.collectionId = collectionId;
      } else if (isEditMode && initialCollectionId) {
        // Allow setting to null (unassign from collection)
        payload.collectionId = null;
      }

      if (isEditMode) {
        await props.onSave(
          props.bookmark.id,
          payload as {
            url: string;
            title: string;
            notes?: string;
            collectionId?: string;
          },
        );
      } else {
        await props.onCreate(
          payload as {
            url: string;
            title?: string;
            notes?: string;
            collectionId?: string;
          },
        );
      }
      onClose();
    } catch {
      // Parent rethrows after showing error — keep dialog open
      setIsSubmitting(false);
    }
  }, [
    url,
    title,
    notes,
    collectionId,
    isEditMode,
    props,
    onClose,
    validateUrl,
    validateTitle,
    initialCollectionId,
  ]);

  const selectedCollection =
    collections.find((c) => c.id === collectionId) ?? null;

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="sm"
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
      <DialogTitle>{isEditMode ? 'Edit Bookmark' : 'New Bookmark'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="URL"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setUrlError('');
          }}
          onBlur={() => validateUrl(url)}
          disabled={isSubmitting}
          error={!!urlError}
          helperText={urlError || undefined}
          sx={{ mb: 2, mt: 1 }}
          slotProps={{
            htmlInput: {
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && !primaryDisabled) {
                  handleSubmit();
                }
              },
            },
          }}
        />
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleError('');
          }}
          onBlur={() => validateTitle(title)}
          disabled={isSubmitting}
          error={!!titleError}
          helperText={titleError || `${title.length}/200`}
          slotProps={{ htmlInput: { maxLength: 200 } }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesError('');
          }}
          onBlur={() => validateNotes(notes)}
          disabled={isSubmitting}
          error={!!notesError}
          helperText={notesError || `${notes.length}/500`}
          multiline
          maxRows={3}
          slotProps={{ htmlInput: { maxLength: 500 } }}
          sx={{ mb: 2 }}
        />
        <Autocomplete
          value={selectedCollection}
          onChange={(_, newValue) => {
            setCollectionId(newValue?.id ?? '');
          }}
          options={collections}
          getOptionLabel={(option) => option.name}
          loading={collectionsLoading}
          renderInput={(params) => <TextField {...params} label="Collection" />}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={primaryDisabled}
        >
          {isEditMode ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
