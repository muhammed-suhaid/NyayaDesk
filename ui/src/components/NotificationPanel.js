import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  Tabs,
  Tab,
  Alert,
  alpha,
  useTheme
} from '@mui/material';

import { NotificationsApi } from '../services/api';

export default function NotificationPanel({ open, onClose }) {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

  const filteredItems = items.filter(item => {
    if (!item || typeof item.isRead === 'undefined') return false;
    if (tabValue === 0) return true;
    if (tabValue === 1) return item.isRead === false;
    if (tabValue === 2) return item.isRead === true;
    return true;
  });

  const load = async () => {
    setError(null);
    try {
      const res = await NotificationsApi.list({ limit: 50 });
      setItems(res.data.data || []);
    } catch (error) {
      setError('Sync failed');
      setItems([]);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { borderLeft: '1px solid', borderColor: 'divider', bgcolor: '#0f172a' } }}>
      <Box sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', height: '100%', color: '#fff' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.9rem' }}>Firm Alerts</Typography>
          <Button
            size="small"
            onClick={async () => {
              await NotificationsApi.readAll();
              await load();
            }}
            sx={{ fontWeight: 800, fontSize: '0.65rem', color: 'info.main' }}
          >
            Mark all read
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" size="small" sx={{ mb: 1, py: 0, fontSize: '0.7rem', bgcolor: alpha(theme.palette.error.main, 0.1), color: '#fff', border: '1px solid', borderColor: 'error.main' }}>
            {error}
          </Alert>
        )}

        <Tabs 
          variant="fullWidth"
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)}
          sx={{ 
            mb: 1, minHeight: 32,
            '& .MuiTab-root': { py: 1, minHeight: 32, fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' },
            '& .Mui-selected': { color: 'info.main' },
            '& .MuiTabs-indicator': { height: 1.5, bgcolor: 'info.main' }
          }}
        >
          <Tab label="ALL" />
          <Tab label="NEW" />
          <Tab label="OLD" />
        </Tabs>

        <List dense sx={{ flexGrow: 1, overflowY: 'auto', px: 0.5 }}>
          {filteredItems.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>No alerts in this category</Typography>
            </Box>
          ) : (
            filteredItems.map((n) => (
              <Box
                key={n?.id}
                onClick={async () => {
                   if (!n?.isRead) {
                    await NotificationsApi.markRead(n?.id);
                    await load();
                  }
                }}
                sx={{ 
                  bgcolor: n?.isRead ? 'transparent' : alpha(theme.palette.info.main, 0.06), 
                  borderRadius: 1.5, 
                  mb: 1,
                  p: 1.2,
                  border: '1px solid',
                  borderColor: n?.isRead ? 'rgba(255,255,255,0.05)' : alpha(theme.palette.info.main, 0.15),
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                <Typography sx={{ fontWeight: n?.isRead ? 600 : 800, color: '#fff', fontSize: '0.75rem', mb: 0.5 }}>
                  {n?.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                  {n?.message}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha(theme.palette.info.main, 0.8), fontWeight: 900 }}>
                  {n?.createdAt && `${new Date(n.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })} • ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </Typography>
              </Box>
            ))
          )}
        </List>
        <Button fullWidth size="small" onClick={onClose} sx={{ mt: 1, fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>Close</Button>
      </Box>
    </Drawer>
  );
}
