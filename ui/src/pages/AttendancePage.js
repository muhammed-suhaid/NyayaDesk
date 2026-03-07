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
} from '@mui/material';

import { AttendanceApi } from '../services/api';

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [form, setForm] = useState({ status: 'Present' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const attRes = await AttendanceApi.list({});
      setRecords(attRes.data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [todayStr]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Attendance</Typography>

      <Card>
        <CardContent>
          {status.message ? <Alert severity={status.type}>{status.message}</Alert> : null}
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
            Save Attendance
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Attendance History
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Advocate</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.advocateName}</TableCell>
                  <TableCell>{r.checkInTime || '-'}</TableCell>
                  <TableCell>{r.checkOutTime || '-'}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading...</TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No attendance records.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
