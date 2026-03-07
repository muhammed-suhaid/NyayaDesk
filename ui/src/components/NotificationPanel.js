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
} from '@mui/material';

import { NotificationsApi } from '../services/api';

export default function NotificationPanel({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

  const filteredItems = items.filter(item => {
    try {
      // Ensure item exists and has isRead property
      if (!item || typeof item.isRead === 'undefined') {
        console.warn('Invalid notification item:', item);
        return false;
      }
      
      if (tabValue === 0) return true; // All
      if (tabValue === 1) return item.isRead === false; // Unread
      if (tabValue === 2) return item.isRead === true; // Read
      return true;
    } catch (error) {
      console.error('Error filtering notification:', item, error);
      return false;
    }
  });

  const load = async () => {
    console.log('Loading notifications...');
    setError(null);
    try {
      const res = await NotificationsApi.list({ limit: 50 });
      console.log('Notifications API response:', res);
      console.log('Response data:', res.data);
      console.log('Response data.data:', res.data.data);
      const notifications = res.data.data || [];
      console.log('Setting items:', notifications);
      console.log('Notification details:', notifications.map(n => ({ id: n?.id, title: n?.title, isRead: n?.isRead })));
      setItems(notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      console.error('Error response:', error.response);
      setError('Failed to load notifications');
      setItems([]);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 2, bgcolor: 'black', color: 'white' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" color="white">Notifications</Typography>
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={{ 
              bgcolor: 'white',
              color: 'black',
              '&:hover': { bgcolor: 'grey.200' }
            }}
            onClick={async () => {
              console.log('Marking all notifications as read');
              await NotificationsApi.readAll();
              await load();
              // Trigger unread count refresh in AppLayout
              if (onClose) {
                onClose();
              }
            }}
          >
            Mark all read
          </Button>
        </Stack>

        <Divider sx={{ my: 1, borderColor: 'grey.600' }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: 'grey.900', color: 'white' }}>
            {error}
            <Button size="small" onClick={load} sx={{ ml: 1, color: 'white' }}>
              Retry
            </Button>
          </Alert>
        )}

        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => {
            console.log('Tab changed to:', newValue);
            setTabValue(newValue);
          }} 
          sx={{ 
            mb: 2,
            bgcolor: 'black',
            borderRadius: 1,
            '& .MuiTabs-flexContainer': {
              bgcolor: 'black',
            },
            '& .MuiTab-root': { 
              color: 'white',
              bgcolor: 'black',
              '&:hover': {
                bgcolor: 'grey.900',
                color: 'white'
              },
              '&.Mui-selected': { 
                color: 'white',
                bgcolor: 'grey.800'
              }
            },
            '& .MuiTabs-indicator': { 
              bgcolor: 'white',
              height: 3
            }
          }}
        >
          <Tab label={`All (${items.length})`} />
          <Tab label={`Unread (${items.filter(n => n && n.isRead === false).length})`} />
          <Tab label={`Read (${items.filter(n => n && n.isRead === true).length})`} />
        </Tabs>

        <List dense sx={{ bgcolor: 'black' }}>
          <Typography variant="caption" color="white" sx={{ px: 2, py: 1 }}>
            {filteredItems.length} notification{filteredItems.length !== 1 ? 's' : ''} (tab: {tabValue})
          </Typography>
          {(() => {
            console.log('Current tab:', tabValue);
            console.log('Total items:', items.length);
            console.log('Filtered items:', filteredItems.length);
            console.log('Items details:', items.map(n => ({ id: n?.id, isRead: n?.isRead, title: n?.title })));
            const unreadCount = items.filter(n => n && n.isRead === false).length;
            const readCount = items.filter(n => n && n.isRead === true).length;
            console.log('Unread count:', unreadCount);
            console.log('Read count:', readCount);
            return null;
          })()}
          {filteredItems.length === 0 ? (
            <ListItem sx={{ bgcolor: 'black' }}>
              <ListItemText
                primary={tabValue === 1 ? "No unread notifications" : tabValue === 2 ? "No read notifications" : "No notifications"}
                secondary={tabValue === 1 ? "All caught up!" : tabValue === 2 ? "No notifications have been read yet" : "You're all caught up!"}
                primaryTypographyProps={{ color: 'white' }}
                secondaryTypographyProps={{ color: 'grey.400' }}
              />
            </ListItem>
          ) : (
            filteredItems.map((n) => (
              <Box
                key={n?.id || Math.random()}
                sx={{ 
                  bgcolor: n?.isRead ? 'grey.900' : 'grey.800', 
                  borderRadius: 1, 
                  mb: 1,
                  border: n?.isRead ? '1px solid grey.700' : '1px solid grey.600',
                  '&:hover': { bgcolor: n?.isRead ? 'grey.800' : 'grey.700' },
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: 80,
                }}
              >
                <Box sx={{ flex: 1, pr: 2, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: n?.isRead ? 'normal' : 'medium',
                      color: 'white',
                      fontSize: '0.9rem',
                      noWrap: true,
                      mb: 1
                    }}
                  >
                    {n?.title || 'Unknown notification'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ 
                      fontSize: '0.75rem', 
                      color: 'grey.300',
                      fontWeight: 'medium',
                      mb: 1,
                      display: 'block'
                    }}
                  >
                    📅 {n?.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Unknown date'}
                  </Typography>
                  {n?.message && (
                    <Typography
                      sx={{
                        color: 'grey.400',
                        fontSize: '0.8rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.3
                      }}
                    >
                      {n.message}
                    </Typography>
                  )}
                </Box>
                <Button
                  size="small"
                  variant={n?.isRead ? "outlined" : "contained"}
                  sx={{ 
                    minWidth: '90px',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    bgcolor: n?.isRead ? 'transparent' : 'white',
                    borderColor: n?.isRead ? 'white' : 'white',
                    color: n?.isRead ? 'white' : 'black',
                    '&:hover': { 
                      bgcolor: n?.isRead ? 'grey.100' : 'grey.200',
                      borderColor: n?.isRead ? 'grey.300' : 'grey.300'
                    }
                  }}
                  onClick={async () => {
                    console.log('Notification clicked:', n?.id, 'isRead:', n?.isRead);
                    if (!n?.isRead) {
                      console.log('Marking notification as read:', n?.id);
                      await NotificationsApi.markRead(n?.id);
                      await load();
                      // Trigger unread count refresh in AppLayout
                      if (onClose) {
                        onClose();
                      }
                    }
                  }}
                >
                  {n?.isRead ? "Read" : "Mark as read"}
                </Button>
              </Box>
            ))
          )}
        </List>
      </Box>
    </Drawer>
  );
}
