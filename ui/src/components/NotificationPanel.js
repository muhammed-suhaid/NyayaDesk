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
} from '@mui/material';

import { NotificationsApi } from '../services/api';

export default function NotificationPanel({ open, onClose }) {
  const [items, setItems] = useState([]);

  const load = async () => {
    const res = await NotificationsApi.list({ limit: 50 });
    setItems(res.data);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Notifications</Typography>
          <Button
            size="small"
            onClick={async () => {
              await NotificationsApi.readAll();
              await load();
            }}
          >
            Mark all read
          </Button>
        </Stack>

        <Divider sx={{ my: 1 }} />

        <List dense>
          {items.map((n) => (
            <ListItem
              key={n.id}
              sx={{ bgcolor: n.isRead ? 'transparent' : 'action.selected', borderRadius: 1, mb: 1 }}
              secondaryAction={
                !n.isRead ? (
                  <Button
                    size="small"
                    onClick={async () => {
                      await NotificationsApi.markRead(n.id);
                      await load();
                    }}
                  >
                    Read
                  </Button>
                ) : null
              }
            >
              <ListItemText
                primary={n.title}
                secondary={
                  <>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(n.createdAt).toLocaleString()}
                    </Typography>
                    {n.message ? (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {n.message}
                      </Typography>
                    ) : null}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
