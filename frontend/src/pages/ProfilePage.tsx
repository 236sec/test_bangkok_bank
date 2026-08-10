import { Avatar, Box, Card, CardContent, Typography } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { fetchMe, type MeResponse } from '../api/me';
import AuthGuard from '../auth/AuthGuard';
import { useError } from '../error/useError';

function ProfileContent() {
  const { getAccessTokenSilently } = useAuth0();
  const { showError } = useError();
  const [profile, setProfile] = useState<MeResponse | null>(null);

  useEffect(() => {
    getAccessTokenSilently()
      .then((token) => fetchMe(token))
      .then((data) => setProfile(data))
      .catch(() => {
        showError('Your session has expired. Please log in again to continue.');
      });
  }, [getAccessTokenSilently, showError]);

  const sub = profile?.sub || 'Unknown user';

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Profile
      </Typography>

      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              {sub.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{sub}</Typography>
              <Typography variant="body2" color="text.secondary">
                Authenticated via Auth0
              </Typography>
            </Box>
          </Box>

          {profile ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                User ID (sub claim)
              </Typography>
              <Typography
                component="code"
                sx={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  wordBreak: 'break-all',
                }}
              >
                {profile.sub}
              </Typography>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
