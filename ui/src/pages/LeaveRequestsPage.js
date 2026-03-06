import React, { useEffect, useState } from 'react';
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

import { AdvocatesApi, LeaveApi } from '../services/api';

export default function LeaveRequestsPage() {
  const [advocates, setAdvocates] = useState([]);
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({ advocateId: '', startDate: '', endDate: '', reason: '' });

  const load = async () => {
    const [advRes, leaveRes] = await Promise.all([AdvocatesApi.list({}), LeaveApi.list({})]);
    setAdvocates(advRes.data);
    setItems(leaveRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Leave Requests</Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Submit Leave Request
          </Typography>
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start date"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End date"
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                disabled={!form.advocateId || !form.startDate || !form.endDate}
                onClick={async () => {
                  await LeaveApi.submit({
                    advocateId: Number(form.advocateId),
                    startDate: form.startDate,
                    endDate: form.endDate,
                    reason: form.reason,
                  });
                  setForm({ advocateId: '', startDate: '', endDate: '', reason: '' });
                  await load();
                }}
              >
                Submit
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                value={form.reason}
                onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Leave History / Approvals
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Advocate</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.advocateName}</TableCell>
                  <TableCell>{r.startDate}</TableCell>
                  <TableCell>{r.endDate}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={async () => { await LeaveApi.update(r.id, { status: 'approved' }); await load(); }}>
                        Approve
                      </Button>
                      <Button size="small" color="error" onClick={async () => { await LeaveApi.update(r.id, { status: 'rejected' }); await load(); }}>
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No leave requests.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
