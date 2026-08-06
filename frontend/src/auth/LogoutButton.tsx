import { Button } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

export default function LogoutButton() {
  const { logout, isLoading } = useAuth0();

  const handleClick = () => {
    void logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <Button
      variant="outlined"
      color="primary"
      onClick={handleClick}
      disabled={isLoading}
    >
      Log out
    </Button>
  );
}
