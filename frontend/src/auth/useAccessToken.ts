import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { useError } from '../error/useError';

/**
 * Returns `getAccessTokenSilently` wrapped with global error handling.
 * When token fetch fails (expired session, network error), surfaces a
 * generic message via the global `ErrorSnackbar` and re-throws so
 * callers can layer on context-specific error handling.
 */
export default function useAccessToken() {
  const { getAccessTokenSilently } = useAuth0();
  const { showError } = useError();

  return useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch {
      showError('Your session has expired. Please log in again.');
      throw new Error('TOKEN_FETCH_FAILED');
    }
  }, [getAccessTokenSilently, showError]);
}
