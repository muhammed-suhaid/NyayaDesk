import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { CasesApi, NotificationsApi } from '../services/api';
import { getRole } from '../auth';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [todayCases, setTodayCases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const role = useMemo(() => getRole(), []);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const load = async () => {
    if (role === 'super_admin') {
      setTodayCases([]);
      setNotifications([]);
      return;
    }

    try {
      const [casesRes, notifRes] = await Promise.all([
        CasesApi.list({ hearingDate: todayStr }),
        NotificationsApi.list({ limit: 8 }),
      ]);
      setTodayCases(casesRes.data);
      setNotifications(notifRes.data);
    } catch {
      setTodayCases([]);
      setNotifications([]);
    }
  };

  useEffect(() => {
    load();
  }, [todayStr]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Dashboard</Typography>

      {role === 'super_admin' ? (
        <Typography variant="body2">Super admin dashboard is available under the Super Admin menu.</Typography>
      ) : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6">Today’s Hearings</Typography>
                <Chip label={todayStr} />
              </Stack>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Case</TableCell>
                    <TableCell>Court</TableCell>
                    <TableCell>Advocate</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayCases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>{c.courtName || '-'}</TableCell>
                      <TableCell>{c.assignedAdvocate?.name || '-'}</TableCell>
                      <TableCell>{c.nextPurpose || '-'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => navigate(`/cases/${c.id}`)}>
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {todayCases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>No hearings scheduled for today.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6">Recent Updates</Typography>
                <Button size="small" onClick={() => navigate('/')}>Refresh</Button>
              </Stack>

              <Stack spacing={1}>
                {notifications.map((n) => (
                  <Card key={n.id} variant="outlined" sx={{ p: 1, bgcolor: n.isRead ? 'transparent' : 'action.selected' }}>
                    <Typography variant="subtitle2">{n.title}</Typography>
                    {n.message ? <Typography variant="body2">{n.message}</Typography> : null}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(n.createdAt).toLocaleString()}
                    </Typography>
                  </Card>
                ))}
                {notifications.length === 0 ? (
                  <Typography variant="body2">No notifications.</Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
