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
  Avatar,
  Stack,
  alpha,
  useTheme,
  Divider,
  Tooltip
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
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useLocation, useNavigate } from 'react-router-dom';

import NotificationPanel from './NotificationPanel';
import ProfileDialog from './ProfileDialog';
import ConfirmationDialog from './ConfirmationDialog';
import { NotificationsApi } from '../services/api';
import { getCurrentUser, getRole, logout } from '../auth';
import { APP_CONFIG, LEGAL_TERMS, USER_ROLES } from '../constants';

const drawerWidth = 200;

const navItems = [
  { label: LEGAL_TERMS.DASHBOARD, path: '/dashboard', icon: <DashboardIcon />, roles: ['admin', 'advocate'] },
  { label: LEGAL_TERMS.CASE + 's', path: '/cases', icon: <GavelIcon />, roles: ['admin', 'advocate'] },
  { label: LEGAL_TERMS.CLIENTS, path: '/clients', icon: <PeopleIcon />, roles: ['admin', 'advocate'] },
  { label: LEGAL_TERMS.TEAM, path: '/advocates', icon: <AccountBoxIcon />, roles: ['admin', 'advocate'] },
  { label: LEGAL_TERMS.ATTENDANCE, path: '/attendance', icon: <EventAvailableIcon />, roles: ['admin', 'advocate'] },
  { label: LEGAL_TERMS.LEAVE, path: '/leave', icon: <AssignmentTurnedInIcon />, roles: ['admin', 'advocate'] },
  { label: LEGAL_TERMS.REPORTS, path: '/reports', icon: <AssessmentIcon />, roles: ['admin', 'advocate'] },
  { label: 'AI Assistant', path: '/ai-assistant', icon: <AutoAwesomeIcon />, roles: ['admin', 'advocate'] },
  { label: LEGAL_TERMS.SETTINGS, path: '/settings', icon: <SettingsIcon />, roles: ['admin'] },
  { label: 'Admin', path: '/superadmin', icon: <CorporateFareIcon />, roles: ['super_admin'] },
];

export default function AppLayout({ children }) {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const activePath = useMemo(() => {
    const item = navItems.find((x) => location.pathname === x.path || location.pathname.startsWith(x.path + '/'));
    return item ? item.path : '';
  }, [location.pathname]);

  const user = useMemo(() => getCurrentUser(), []);
  const role = user?.role;

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
          <GavelIcon sx={{ fontSize: 14, color: '#fff' }} />
        </Avatar>
        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#fff' }}>{APP_CONFIG.BRAND_NAME}</Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />

      <List sx={{ px: 1, flexGrow: 1 }}>
        {visibleNavItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={activePath === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{ py: 0.5, mb: 0.2, borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: activePath === item.path ? 'primary.main' : 'rgba(255,255,255,0.4)' }}>
              {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ sx: { fontWeight: activePath === item.path ? 800 : 500, fontSize: '0.75rem', color: activePath === item.path ? '#fff' : 'rgba(255,255,255,0.6)' } }} 
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', fontWeight: 800 }}>{user?.name?.charAt(0).toUpperCase() || '?'}</Avatar>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#fff', fontSize: '0.65rem', display: 'block' }}>{user?.name || 'User'}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem' }}>{role === 'admin' ? USER_ROLES.ADMIN : role === 'advocate' ? USER_ROLES.ADVOCATE : role?.toUpperCase()}</Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer - 1
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 2, minHeight: 48 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary' }}>
            {navItems.find(n => n.path === activePath)?.label || APP_CONFIG.BRAND_NAME}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => setNotifOpen(true)}>
              <Badge color="error" variant="dot" invisible={unreadCount === 0}>
                <NotificationsIcon sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>
            <IconButton 
              size="small"
              onClick={(e) => setProfileAnchorEl(e.currentTarget)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', fontWeight: 900, bgcolor: 'primary.main' }}>
                {role?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Stack>

          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={() => setProfileAnchorEl(null)}
            PaperProps={{ sx: { minWidth: 150, borderRadius: 1.5, mt: 1, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)' } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.primary', display: 'block' }}>{user?.name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>{user?.email}</Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem 
              onClick={() => {
                setProfileAnchorEl(null);
                setProfileOpen(true);
              }}
              sx={{ py: 0.7 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}><PersonIcon sx={{ fontSize: 16 }} /></ListItemIcon>
              <ListItemText primary="My Profile" primaryTypographyProps={{ variant: 'caption', fontWeight: 800 }} />
            </MenuItem>
            <MenuItem 
              onClick={() => {
                setProfileAnchorEl(null);
                setLogoutConfirm(true);
              }}
              sx={{ color: 'error.main', py: 0.7 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}><LogoutIcon sx={{ fontSize: 16 }} color="error" /></ListItemIcon>
              <ListItemText primary="Sign Out" primaryTypographyProps={{ variant: 'caption', fontWeight: 800 }} />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: 'none' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 2, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar sx={{ minHeight: '48px !important' }} />
        {children}
      </Box>

      <NotificationPanel open={notifOpen} onClose={() => { setNotifOpen(false); fetchUnread(); }} />
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      
      <ConfirmationDialog 
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          navigate('/login', { replace: true });
        }}
        title="Sign Out?"
        message="Are you sure you want to end your current session?"
        confirmText="Sign Out"
        severity="info"
      />
    </Box>
  );
}
