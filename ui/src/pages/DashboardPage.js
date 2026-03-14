import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Button,
  Box,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar,
  CircularProgress,
  Avatar,
  IconButton,
  alpha,
  useTheme,
  Divider,
  Paper
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate } from 'react-router-dom';
import GavelIcon from '@mui/icons-material/Gavel';
import EventIcon from '@mui/icons-material/Event';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { NotificationsApi, ReportsApi } from '../services/api';
import { getRole } from '../auth';
import { UI_ACTIONS, DASHBOARD_METRICS, MESSAGES, LEGAL_TERMS, APP_CONFIG } from '../constants';
import UpcomingHearingsCard from '../components/UpcomingHearingsCard';
import DashboardCharts from '../components/DashboardCharts';

const SummaryCard = ({ title, value, icon, color }) => (
  <Card sx={{ 
    boxShadow: 'none', 
    border: '1px solid', 
    borderColor: 'divider', 
    borderRadius: 2,
    height: '100%',
    transition: 'all 0.2s',
    '&:hover': { borderColor: color }
  }}>
    <CardContent sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ 
          bgcolor: alpha(color, 0.1), 
          p: 1, 
          borderRadius: 1.5, 
          display: 'flex', 
          color: color,
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 18 } })}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 0.1, fontSize: '0.6rem', textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);


export default function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const role = useMemo(() => getRole(), []);

  const load = async () => {
    if (role === 'super_admin') return;
    try {
      const [notifRes, summaryRes] = await Promise.all([
        NotificationsApi.list({ limit: 5 }),
        ReportsApi.getSummary()
      ]);
      setNotifications(notifRes.data.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && role !== 'super_admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={24} thickness={5} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 1.5 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>{LEGAL_TERMS.DASHBOARD}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Summary of firm metrics and activity.</Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => navigate('/reports')} sx={{ fontWeight: 800 }}>{LEGAL_TERMS.REPORTS}</Button>
        </Box>

      {role === 'super_admin' ? (
        <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Super Admin Portal</Typography>
          <Button variant="contained" size="small" onClick={() => navigate('/superadmin')}>Open Portal</Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <SummaryCard title={DASHBOARD_METRICS.TOTAL_CASES} value={summary?.totalCases || 0} icon={<GavelIcon />} color={theme.palette.primary.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <SummaryCard title={DASHBOARD_METRICS.ACTIVE_CASES} value={summary?.activeCases || 0} icon={<TrendingUpIcon />} color={theme.palette.success.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <SummaryCard title={DASHBOARD_METRICS.HEARINGS} value={summary?.upcomingHearings || 0} icon={<EventIcon />} color={theme.palette.warning.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <SummaryCard title={DASHBOARD_METRICS.PENDING} value={summary?.pendingTasks || 0} icon={<RecordVoiceOverIcon />} color={theme.palette.error.main} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={8}>
              <Stack spacing={2}>
                <UpcomingHearingsCard />
                <DashboardCharts />
              </Stack>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5 }}>{DASHBOARD_METRICS.RECENT_UPDATES}</Typography>
                  <Stack spacing={0.5}>
                    {notifications.map((n) => (
                      <Box key={n.id} sx={{ p: 1, borderRadius: 1.5, bgcolor: n.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.03) }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{n.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1, fontSize: '0.65rem' }}>{n.message}</Typography>
                      </Box>
                    ))}
                    {notifications.length === 0 && <Typography variant="caption" sx={{ py: 2, textAlign: 'center', display: 'block', opacity: 0.5 }}>{MESSAGES.NO_UPDATES}</Typography>}
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Button fullWidth size="small" onClick={() => load()} sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.65rem' }}>{UI_ACTIONS.REFRESH}</Button>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2, borderRadius: 2.5, bgcolor: theme.palette.primary.main, color: '#fff' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5 }}>{DASHBOARD_METRICS.SUPPORT}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1.5, fontSize: '0.65rem' }}>{MESSAGES.HELP_MESSAGE}</Typography>
                  <Stack spacing={1}>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      size="small" 
                      fullWidth 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${APP_CONFIG.SUPPORT_EMAIL}`}
                      target="_blank"
                      sx={{ fontWeight: 900, fontSize: '0.7rem' }}
                      startIcon={<MailOutlineIcon sx={{ fontSize: 16 }} />}
                    >
                      Gmail
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      fullWidth 
                      href={`https://wa.me/${APP_CONFIG.SUPPORT_PHONE.replace('+', '')}`}
                      target="_blank"
                      sx={{ 
                        fontWeight: 900, 
                        fontSize: '0.7rem', 
                        bgcolor: '#25D366', 
                        color: '#fff',
                        '&:hover': { bgcolor: '#128C7E' }
                      }}
                      startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                    >
                      WhatsApp
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      </Stack>
    </Box>
  );
}
