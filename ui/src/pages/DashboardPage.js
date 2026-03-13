import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GavelIcon from '@mui/icons-material/Gavel';
import EventIcon from '@mui/icons-material/Event';
import SpeedIcon from '@mui/icons-material/Speed';

import { NotificationsApi, ReportsApi } from '../services/api';
import { getRole } from '../auth';
import UpcomingHearingsCard from '../components/UpcomingHearingsCard';
import DashboardCharts from '../components/DashboardCharts';

const SummaryCard = ({ title, value, icon, color }) => (
  <Card sx={{ 
    boxShadow: 'none', 
    border: '1px solid', 
    borderColor: 'divider', 
    borderRadius: 4,
    height: '100%' 
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ 
          bgcolor: `${color}11`, 
          p: 1.5, 
          borderRadius: 3, 
          display: 'flex', 
          color: color 
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
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

  useEffect(() => {
    load();
  }, []);

  if (loading && role !== 'super_admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', py: 4, px: { xs: 2, md: 4 } }}>
      <Stack spacing={6}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em', color: 'text.primary' }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Analyze your firm's performance and upcoming hearings.
          </Typography>
        </Box>

      {role === 'super_admin' ? (
        <Typography variant="body2">Super admin dashboard is available under the Super Admin menu.</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard title="Total Cases" value={summary?.totalCases || 0} icon={<GavelIcon />} color="#6366f1" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard title="Active Cases" value={summary?.activeCases || 0} icon={<SpeedIcon />} color="#10b981" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard title="Upcoming Hearings" value={summary?.upcomingHearings || 0} icon={<EventIcon />} color="#f59e0b" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard title="Pending Tasks" value={summary?.pendingTasks || 0} icon={<SpeedIcon />} color="#ef4444" />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                <UpcomingHearingsCard />
                <DashboardCharts />
              </Stack>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card sx={{ 
                boxShadow: 'none', 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 4,
                position: 'sticky',
                top: 88
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
                    <Button size="small" variant="text" sx={{ color: 'text.secondary', fontSize: '0.75rem' }} onClick={() => load()}>Refresh</Button>
                  </Stack>

                  <Stack spacing={2}>
                    {notifications.map((n) => (
                      <Box key={n.id} sx={{ 
                        p: 2, 
                        bgcolor: n.isRead ? 'transparent' : 'action.hover', 
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: n.isRead ? 'divider' : 'primary.main',
                        opacity: n.isRead ? 0.7 : 1
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.8rem' }}>{n.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{n.message}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                    {notifications.length === 0 ? (
                      <Typography variant="caption" color="text.disabled">No new updates found.</Typography>
                    ) : null}
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
