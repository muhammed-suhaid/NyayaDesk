import { createTheme } from '@mui/material/styles';

export const nyayaDeskTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#111111',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
      contrastText: '#111111',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#111111',
      secondary: '#444444',
    },
    divider: 'rgba(17,17,17,0.12)',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      'Inter',
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          color: '#ffffff',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111111',
          color: '#ffffff',
          borderRight: '1px solid rgba(255,255,255,0.10)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginLeft: 8,
          marginRight: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(201,162,39,0.16)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(201,162,39,0.22)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
          minWidth: 40,
          opacity: 0.9,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(17,17,17,0.08)',
        },
      },
    },
  },
});
