import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

import { AdvocatesApi, AttendanceApi } from '../services/api';

export default function AttendancePage() {
  const [advocates, setAdvocates] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ advocateId: '', date: '', checkInTime: '', checkOutTime: '', status: 'present' });

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const load = async () => {
    const [advRes, attRes] = await Promise.all([AdvocatesApi.list({}), AttendanceApi.list({})]);
    setAdvocates(advRes.data);
    setRecords(attRes.data);
  };

  useEffect(() => {
    load();
    setForm((s) => ({ ...s, date: todayStr }));
  }, [todayStr]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Attendance</Typography>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Advocate</InputLabel>
                <Select
                  label="Advocate"
                  value={form.advocateId}
                  onChange={(e) => setForm((s) => ({ ...s, advocateId: e.target.value }))}
                >
                  {advocates.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Check-in"
                placeholder="09:30"
                value={form.checkInTime}
                onChange={(e) => setForm((s) => ({ ...s, checkInTime: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Check-out"
                placeholder="18:00"
                value={form.checkOutTime}
                onChange={(e) => setForm((s) => ({ ...s, checkOutTime: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                >
                  <MenuItem value="present">present</MenuItem>
                  <MenuItem value="absent">absent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            sx={{ mt: 2 }}
            variant="contained"
            disabled={!form.advocateId || !form.date}
            onClick={async () => {
              await AttendanceApi.mark({
                ...form,
                advocateId: Number(form.advocateId),
                checkInTime: form.checkInTime || null,
                checkOutTime: form.checkOutTime || null,
              });
              setForm((s) => ({ ...s, checkInTime: '', checkOutTime: '' }));
              await load();
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
              {records.length === 0 ? (
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
