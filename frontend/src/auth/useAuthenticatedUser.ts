import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useError } from '../error/useError';

export function useAuthenticatedUser() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } =
    useAuth0();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { showError } = useError();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      getAccessTokenSilently()
        .then((token) => setAccessToken(token))
        .catch(() => {
          showError(
            'Your session has expired. Please log in again to continue.',
          );
        });
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently, showError]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
  };
}
