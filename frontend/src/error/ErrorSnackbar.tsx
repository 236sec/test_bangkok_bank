import { Alert, Snackbar } from '@mui/material';
import { useError } from './useError';

export default function ErrorSnackbar() {
  const { error, clearError } = useError();

  if (!error) {
    return null;
  }

  return (
    <Snackbar
      open
      autoHideDuration={8000}
      onClose={clearError}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity="error"
        variant="filled"
        onClose={clearError}
        sx={{ width: '100%' }}
      >
        {error}
      </Alert>
    </Snackbar>
  );
}
