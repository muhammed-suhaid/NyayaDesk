import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

import { AttendanceApi, AdvocatesApi } from '../services/api';
import { getRole } from '../auth';

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [form, setForm] = useState({ status: 'Present' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advocates, setAdvocates] = useState([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const role = getRole();
  const canViewAllAttendance = role === 'admin';
  const canManageAttendance = role === 'admin';

  // Get days in current month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Get month string for API
  const getMonthString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Get attendance status for a specific advocate and day
  const getAttendanceStatus = (advocateId, day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // For advocates (current user), match by any advocate ID since they only see their own records
    if (advocateId === 'current-user') {
      const record = records.find(r => r.date === dateStr);
      // Handle object data structure
      return record?.status || record?.attendance?.status || null;
    }

    // For admins, match by specific advocate ID
    const record = records.find(r =>
      r.advocateId === advocateId && r.date === dateStr
    );
    // Handle object data structure
    return record?.status || record?.attendance?.status || null;
  };

  // Get display advocates (either all or current user)
  const displayAdvocates = useMemo(() => {
    if (!canViewAllAttendance) {
      // For advocates, create a virtual advocate entry for themselves
      // since they might not be in the advocates list
      return [{
        id: 'current-user',
        name: 'My Attendance',
        isUserAdvocate: true
      }];
    }
    return selectedAdvocate
      ? advocates.filter(adv => adv.id === parseInt(selectedAdvocate))
      : advocates;
  }, [advocates, canViewAllAttendance, selectedAdvocate]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const loadAdvocates = async () => {
    if (!canViewAllAttendance) return;

    try {
      const res = await AdvocatesApi.list({});
      setAdvocates(res.data);
    } catch (error) {
      console.error('Failed to load advocates:', error);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = { month: getMonthString(currentMonth) };
      if (canViewAllAttendance && selectedAdvocate) {
        params.advocateId = selectedAdvocate;
      }
      const attRes = await AttendanceApi.list(params);
      setRecords(attRes.data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvocates();
  }, []);

  useEffect(() => {
    load();
  }, [currentMonth, selectedAdvocate]);

  const handleDownload = async () => {
    try {
      const params = { month: getMonthString(currentMonth) };
      if (selectedAdvocate) params.advocateId = selectedAdvocate;

      const res = await AttendanceApi.export(params);

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;

      const filename = `attendance_${params.month}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to download attendance report' });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">
          {canViewAllAttendance ? 'Attendance Management' : 'My Attendance'}
        </Typography>
        {canViewAllAttendance && advocates.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Advocate</InputLabel>
            <Select
              value={selectedAdvocate}
              label="Filter by Advocate"
              onChange={(e) => setSelectedAdvocate(e.target.value)}
            >
              <MenuItem value="">All Advocates</MenuItem>
              {advocates.map((adv) => (
                <MenuItem key={adv.id} value={adv.id}>
                  {adv.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      <Card>
        <CardContent>
          {status.message ? <Alert severity={status.type}>{status.message}</Alert> : null}

          {/* Only show attendance marking for advocates */}
          {role === 'advocate' && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant={form.status === 'Present' ? 'contained' : 'outlined'}
                  onClick={() => setForm({ status: 'Present' })}
                  disabled={saving || loading}
                >
                  Present (Today)
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  color="error"
                  variant={form.status === 'Absent' ? 'contained' : 'outlined'}
                  onClick={() => setForm({ status: 'Absent' })}
                  disabled={saving || loading}
                >
                  Absent (Today)
                </Button>
              </Grid>
            </Grid>
          )}

          {/* Only show attendance marking submit button for advocates */}
          {role === 'advocate' && (
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              disabled={saving || loading}
              onClick={async () => {
                setStatus({ type: '', message: '' });
                if (saving) return;
                setSaving(true);
                try {
                  await AttendanceApi.mark({ status: form.status });
                  setStatus({ type: 'success', message: 'Attendance saved' });
                  await load();
                } catch (e) {
                  setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to save attendance' });
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? 'Saving...' : 'Mark Attendance'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                Previous
              </Button>
              <Button
                size="small"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Next
              </Button>
              {canViewAllAttendance && (
                <Tooltip title="Download CSV Report">
                  <IconButton color="primary" onClick={handleDownload} size="small" sx={{ ml: 1 }}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* Calendar Grid */}
          <Box sx={{ overflowX: 'auto' }}>
            <Paper sx={{ p: 2, minWidth: 1000 }}>
              {/* Attendance Rows */}
              {displayAdvocates.map(advocate => (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, minHeight: 45 }} key={advocate.id}>
                  {/* Advocate Name */}
                  <Box sx={{
                    width: 150,
                    minWidth: 150,
                    pr: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" fontWeight="medium" noWrap>
                      {advocate.name}
                    </Typography>
                  </Box>

                  {/* Attendance Days */}
                  <Box sx={{ display: 'flex', flex: 1 }}>
                    {getDaysInMonth(currentMonth).map(day => {
                      const status = getAttendanceStatus(advocate.id, day);
                      const isToday = day === new Date().getDate() &&
                        currentMonth.getMonth() === new Date().getMonth() &&
                        currentMonth.getFullYear() === new Date().getFullYear();

                      // Debug: Log the status for this day
                      console.log(`Day ${day} status:`, status, 'for advocate:', advocate.id);

                      let bgColor = 'transparent';
                      let textColor = '#666666';

                      if (status === 'Present' || status === 'present') {
                        bgColor = '#2e7d32';
                        textColor = '#ffffff';
                      } else if (status === 'Absent' || status === 'absent') {
                        bgColor = '#d32f2f';
                        textColor = '#ffffff';
                      }

                      return (
                        <Box
                          key={day}
                          sx={{
                            width: 35,
                            minWidth: 35,
                            height: 35,
                            margin: '2px',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            border: isToday ? '2px solid' : '1px solid',
                            borderColor: isToday ? '#1976d2' : '#d0d0d0',
                            backgroundColor: bgColor,
                            color: textColor,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: (status === 'Present' || status === 'present') ? '#1b5e20' :
                                (status === 'Absent' || status === 'absent') ? '#c62828' : '#f5f5f5',
                              transform: 'scale(1.1)',
                              zIndex: 1
                            }
                          }}
                          title={`${advocate.name} - Day ${day}: ${status || 'Not marked'}`}
                        >
                          {day}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography>Loading attendance data...</Typography>
                </Box>
              )}

              {!loading && displayAdvocates.length === 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography>No advocates to display.</Typography>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Legend */}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 20, height: 20, backgroundColor: 'success.main', borderRadius: 1 }} />
              <Typography variant="caption">Present</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 20, height: 20, backgroundColor: 'error.main', borderRadius: 1 }} />
              <Typography variant="caption">Absent</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 20, height: 20, border: '1px solid grey.300', borderRadius: 1 }} />
              <Typography variant="caption">Not Marked</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
