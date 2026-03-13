import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Button,
  Box,
  CircularProgress,
  Avatar,
  IconButton,
  alpha,
  useTheme,
  Divider,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GavelIcon from '@mui/icons-material/Gavel';
import EventIcon from '@mui/icons-material/Event';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import { NotificationsApi, ReportsApi } from '../services/api';
import { getRole } from '../auth';
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
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.1 }}>Dashboard</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Daily overview of firm metrics and updates.</Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => navigate('/reports')} sx={{ fontWeight: 800 }}>Reports</Button>
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
              <SummaryCard title="Total Cases" value={summary?.totalCases || 0} icon={<GavelIcon />} color={theme.palette.primary.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <SummaryCard title="Active Cases" value={summary?.activeCases || 0} icon={<TrendingUpIcon />} color={theme.palette.success.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <SummaryCard title="Hearings" value={summary?.upcomingHearings || 0} icon={<EventIcon />} color={theme.palette.warning.main} />
            </Grid>
            <Grid item xs={6} md={3}>
              <SummaryCard title="Pending" value={summary?.pendingTasks || 0} icon={<RecordVoiceOverIcon />} color={theme.palette.error.main} />
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5 }}>Recent Updates</Typography>
                  <Stack spacing={0.5}>
                    {notifications.map((n) => (
                      <Box key={n.id} sx={{ p: 1, borderRadius: 1.5, bgcolor: n.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.03) }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{n.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1, fontSize: '0.65rem' }}>{n.message}</Typography>
                      </Box>
                    ))}
                    {notifications.length === 0 && <Typography variant="caption" sx={{ py: 2, textAlign: 'center', display: 'block', opacity: 0.5 }}>No updates</Typography>}
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Button fullWidth size="small" onClick={() => load()} sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.65rem' }}>Refresh</Button>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2, borderRadius: 2.5, bgcolor: theme.palette.primary.main, color: '#fff' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5 }}>Support</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1.5, fontSize: '0.65rem' }}>Need help? Contact our firm support line.</Typography>
                  <Button variant="contained" color="secondary" size="small" fullWidth sx={{ fontWeight: 900, fontSize: '0.7rem' }}>Contact Help</Button>
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
