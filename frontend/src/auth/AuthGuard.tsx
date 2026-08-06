import { Box, CircularProgress } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect().catch(console.error);
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
