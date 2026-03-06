import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';

import { nyayaDeskTheme } from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={nyayaDeskTheme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
