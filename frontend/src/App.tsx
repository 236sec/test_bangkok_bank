import { Box } from '@mui/material';
import { Outlet } from 'react-router';

export default function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="nav"
        sx={{ width: 240, p: 2, borderRight: 1, borderColor: 'divider' }}
      >
        {/* Sidebar navigation will be built in a later phase */}
      </Box>
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
