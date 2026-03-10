import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

import { getRole } from '../auth';
import { LeaveApi } from '../services/api';

export default function LeaveRequestsPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '' });
  const role = getRole();
  const [errors, setErrors] = useState({ fromDate: '', toDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const validate = () => {
    const next = { fromDate: '', toDate: '', reason: '' };
    if (!form.fromDate) next.fromDate = 'From date is required';
    if (!form.toDate) next.toDate = 'To date is required';
    if (!String(form.reason || '').trim()) next.reason = 'Reason is required';

    if (form.fromDate && form.toDate) {
      const from = new Date(form.fromDate);
      const to = new Date(form.toDate);
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to < from) {
        next.toDate = 'To date cannot be earlier than From date';
      }
    }

    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const load = async () => {
    const leaveRes = await LeaveApi.list({});
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
          {/* Only show leave request form to non-admin users */}
          {role !== 'admin' && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Submit Leave Request
              </Typography>
              {status.message ? <Alert severity={status.type}>{status.message}</Alert> : null}
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="From"
                    InputLabelProps={{ shrink: true }}
                    value={form.fromDate}
                    onChange={(e) => setForm((s) => ({ ...s, fromDate: e.target.value }))}
                    error={Boolean(errors.fromDate)}
                    helperText={errors.fromDate}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="To"
                    InputLabelProps={{ shrink: true }}
                    value={form.toDate}
                    onChange={(e) => setForm((s) => ({ ...s, toDate: e.target.value }))}
                    error={Boolean(errors.toDate)}
                    helperText={errors.toDate}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={submitting}
                    onClick={async () => {
                      setStatus({ type: '', message: '' });
                      if (submitting) return;
                      if (!validate()) return;
                      setSubmitting(true);
                      try {
                        await LeaveApi.submit({
                          fromDate: form.fromDate,
                          toDate: form.toDate,
                          reason: form.reason,
                        });
                        setForm({ fromDate: '', toDate: '', reason: '' });
                        setErrors({ fromDate: '', toDate: '', reason: '' });
                        setStatus({ type: 'success', message: 'Leave request submitted' });
                        await load();
                      } catch (e) {
                        setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to submit leave request' });
                      } finally {
                        setSubmitting(false);
                      }
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
                    error={Boolean(errors.reason)}
                    helperText={errors.reason}
                  />
                </Grid>
              </Grid>
            </>
          )}
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
                {role === 'admin' ? <TableCell>Advocate</TableCell> : null}
                <TableCell>Date From</TableCell>
                <TableCell>Date To</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                {role === 'admin' ? <TableCell /> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  {role === 'admin' ? <TableCell>{r.advocateName}</TableCell> : null}
                  <TableCell>{r.startDate}</TableCell>
                  <TableCell>{r.endDate}</TableCell>
                  <TableCell>{r.reason || '-'}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  {role === 'admin' ? (
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          disabled={updatingId === r.id}
                          onClick={async () => {
                            if (updatingId) return;
                            setUpdatingId(r.id);
                            try {
                              await LeaveApi.update(r.id, { status: 'approved' });
                              await load();
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={updatingId === r.id}
                          onClick={async () => {
                            if (updatingId) return;
                            setUpdatingId(r.id);
                            try {
                              await LeaveApi.update(r.id, { status: 'rejected' });
                              await load();
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === 'admin' ? 6 : 4}>No leave requests.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
