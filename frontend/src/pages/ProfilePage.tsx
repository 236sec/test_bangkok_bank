import { Avatar, Box, Card, CardContent, Typography } from '@mui/material';
import AuthGuard from '../auth/AuthGuard';
import { useAuthenticatedUser } from '../auth/useAuthenticatedUser';

function ProfileContent() {
  const { user, accessToken } = useAuthenticatedUser();

  const name = user?.name || user?.email || 'Unknown user';
  const email = user?.email || 'No email on file';
  const picture = user?.picture;

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Profile
      </Typography>

      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={picture}
              alt={name}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
            </Box>
          </Box>

          {accessToken ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Access token (truncated, demo only)
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
                {truncateToken(accessToken)}
              </Typography>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  );
}

function truncateToken(token: string, maxLength = 80): string {
  if (token.length <= maxLength) {
    return token;
  }
  return `${token.slice(0, maxLength)}…`;
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
