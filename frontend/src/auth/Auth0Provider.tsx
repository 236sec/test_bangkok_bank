import {
  Auth0Provider as Auth0ReactProvider,
  type AppState,
} from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { env } from '../env';

interface Auth0ProviderProps {
  children: ReactNode;
}

export default function Auth0Provider({ children }: Auth0ProviderProps) {
  const navigate = useNavigate();

  const handleRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo || '/profile');
  };

  return (
    <Auth0ReactProvider
      domain={env.VITE_AUTH0_DOMAIN}
      clientId={env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/callback`,
        audience: env.VITE_AUTH0_AUDIENCE,
      }}
      onRedirectCallback={handleRedirectCallback}
      useRefreshTokens
      cacheLocation="localstorage"
    >
      {children}
    </Auth0ReactProvider>
  );
}
