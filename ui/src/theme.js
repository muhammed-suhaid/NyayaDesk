import { createTheme } from '@mui/material/styles';

const primaryMain = '#1e1b4b'; 
const secondaryMain = '#6366f1'; 

export const nyayaDeskTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryMain,
      light: '#4338ca',
      dark: '#1e1b4b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: secondaryMain,
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: 'rgba(15, 23, 42, 0.06)',
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#0ea5e9' },
  },
  shape: {
    borderRadius: 8, // Reduced from 16
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    ...Array(20).fill('none'),
  ],
  typography: {
    fontFamily: [
      'Inter',
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { fontSize: '1rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem' },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em', fontSize: '0.8125rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#cbd5e1 #f1f5f9",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#f1f5f9",
            width: 6,
            height: 6,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#cbd5e1",
            minHeight: 24,
            border: "1px solid #f1f5f9",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '6px 16px', // Reduced padding
        },
        sizeSmall: {
          padding: '4px 12px',
          fontSize: '0.75rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          color: '#0f172a',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e1b4b',
          color: '#ffffff',
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px', // Reduced margin
          padding: '8px 12px', // Reduced padding
          color: 'rgba(255,255,255,0.7)',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#fff',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#fff',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
          minWidth: 32, // Reduced from 38
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid rgba(15, 23, 42, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 16px', // Compact padding
          borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
        },
        head: {
          padding: '10px 16px',
          backgroundColor: '#f8fafc',
        },
      },
    },
  },
});
