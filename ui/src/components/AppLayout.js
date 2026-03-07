import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Badge,
  Box,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GavelIcon from '@mui/icons-material/Gavel';
import PeopleIcon from '@mui/icons-material/People';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useLocation, useNavigate } from 'react-router-dom';

import NotificationPanel from './NotificationPanel';
import { NotificationsApi } from '../services/api';
import { getRole, logout } from '../auth';

const drawerWidth = 240;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, roles: ['admin', 'advocate'] },
  { label: 'Cases', path: '/cases', icon: <GavelIcon />, roles: ['admin', 'advocate'] },
  { label: 'Clients', path: '/clients', icon: <PeopleIcon />, roles: ['admin', 'advocate'] },
  { label: 'Advocates', path: '/advocates', icon: <AccountBoxIcon />, roles: ['admin', 'advocate'] },
  { label: 'Attendance', path: '/attendance', icon: <EventAvailableIcon />, roles: ['admin', 'advocate'] },
  { label: 'Leave Requests', path: '/leave', icon: <AssignmentTurnedInIcon />, roles: ['admin', 'advocate'] },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon />, roles: ['admin', 'advocate'] },
  { label: 'Super Admin', path: '/superadmin', icon: <AssessmentIcon />, roles: ['super_admin'] },
];

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const activePath = useMemo(() => {
    const item = navItems.find((x) => location.pathname.startsWith(x.path));
    return item ? item.path : '';
  }, [location.pathname]);

  const role = useMemo(() => getRole(), []);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((i) => !i.roles || i.roles.includes(role));
  }, [role]);

  const fetchUnread = async () => {
    try {
      const res = await NotificationsApi.list({ unread: 1, limit: 100 });
      setUnreadCount(res.data.data.length);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 15000);
    return () => clearInterval(t);
  }, []);

  const drawer = (
    <Box sx={{ px: 0, py: 1 }}>
      <Toolbar />
      <List>
        {visibleNavItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={activePath === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton
          selected={location.pathname.startsWith('/profile')}
          onClick={() => {
            navigate('/profile');
            setMobileOpen(false);
          }}
        >
          <ListItemIcon>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            NyayaDesk - Kerala Legal Case Management
          </Typography>

          <IconButton color="inherit" onClick={() => setNotifOpen(true)}>
            <Badge color="error" badgeContent={unreadCount}>
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton color="inherit" onClick={(e) => setProfileAnchorEl(e.currentTarget)}>
            <AccountCircleIcon />
          </IconButton>

          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={() => setProfileAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() => {
                setProfileAnchorEl(null);
                navigate('/profile');
              }}
            >
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                setProfileAnchorEl(null);
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>

      <NotificationPanel
        open={notifOpen}
        onClose={() => {
          setNotifOpen(false);
          fetchUnread();
        }}
      />
    </Box>
  );
}
