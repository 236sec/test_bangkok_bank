import { Button } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

export default function LoginButton() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleClick = () => {
    void loginWithRedirect({ appState: { returnTo: '/profile' } });
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleClick}
      disabled={isLoading}
    >
      Log in
    </Button>
  );
}
