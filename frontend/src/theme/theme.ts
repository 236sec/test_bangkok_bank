import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: {
    // Enables CSS-native color derivation (color-mix in oklch) so the palette
    // can reference CSS custom property tokens (var()) instead of hardcoded
    // colors. MUI v9 cannot parse var()/oklch values with JS color math.
    nativeColor: true,
  },
  palette: {
    mode: 'light',
    primary: {
      main: 'var(--primary)',
      contrastText: 'var(--primary-foreground)',
    },
    secondary: {
      main: 'var(--secondary)',
      contrastText: 'var(--secondary-foreground)',
    },
    background: {
      default: 'var(--background)',
      paper: 'var(--card)',
    },
    text: {
      primary: 'var(--foreground)',
      secondary: 'var(--muted-foreground)',
    },
    error: {
      main: 'var(--destructive)',
    },
    divider: 'var(--border)',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'var(--font-sans)',
  },
});

export default theme;
