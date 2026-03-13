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
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  useTheme,
  alpha,
  Divider,
  Fade,
  Tooltip,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  CalendarMonth,
  PostAdd,
  CheckCircle,
  Cancel,
  History,
  Info,
  Pending,
  MoreVert
} from '@mui/icons-material';

import { getRole } from '../auth';
import { LeaveApi } from '../services/api';

const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Personal', 'Maternity/Paternity'];

const StatusChip = ({ status }) => {
  const theme = useTheme();
  const configs = {
    pending: { color: theme.palette.warning.main, icon: <Pending fontSize="small" />, label: 'Pending' },
    approved: { color: theme.palette.success.main, icon: <CheckCircle fontSize="small" />, label: 'Approved' },
    rejected: { color: theme.palette.error.main, icon: <Cancel fontSize="small" />, label: 'Rejected' }
  };
  const config = configs[status] || configs.pending;

  return (
    <Chip
      size="small"
      icon={React.cloneElement(config.icon, { style: { color: config.color } })}
      label={config.label}
      sx={{ 
        fontWeight: 800, 
        borderRadius: 1.5,
        textTransform: 'uppercase',
        fontSize: '0.65rem',
        bgcolor: alpha(config.color, 0.1),
        color: config.color,
        border: '1px solid',
        borderColor: alpha(config.color, 0.2),
        '& .MuiChip-label': { px: 1 }
      }}
    />
  );
};

export default function LeaveRequestsPage() {
  const theme = useTheme();
  const role = getRole();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [form, setForm] = useState({ 
    fromDate: '', 
    toDate: '', 
    reason: '', 
    leaveType: 'Casual' 
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [openSubmit, setOpenSubmit] = useState(false);
  const [filter, setFilter] = useState('all');

  const validate = () => {
    const next = {};
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
    return Object.keys(next).length === 0;
  };

  const load = async () => {
    setLoading(true);
    try {
      const leaveRes = await LeaveApi.list({});
      setItems(leaveRes.data);
    } catch {
      setStatus({ type: 'error', message: 'Failed to load leave requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await LeaveApi.update(id, { status: newStatus });
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const filteredItems = items.filter(i => filter === 'all' || i.status === filter);

  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack spacing={4}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
              Leave Requests
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage time off and absence records
            </Typography>
          </Box>
          {role === 'advocate' && (
            <Button
              variant="contained"
              startIcon={<PostAdd />}
              sx={{ borderRadius: 3, px: 3, py: 1.2 }}
              onClick={() => setOpenSubmit(true)}
            >
              New Request
            </Button>
          )}
        </Box>

        {/* Stats Section */}
        <Grid container spacing={3}>
          {[
            { label: 'Total Requests', value: stats.total, icon: <History />, color: theme.palette.primary.main },
            { label: 'Pending Approvals', value: stats.pending, icon: <Pending />, color: theme.palette.warning.main },
            { label: 'Approved Leaves', value: stats.approved, icon: <CheckCircle />, color: theme.palette.success.main }
          ].map((stat, idx) => (
            <Grid item xs={12} sm={4} key={idx}>
              <Card sx={{ 
                borderRadius: 4, 
                border: '1px solid', 
                borderColor: alpha(stat.color, 0.1),
                bgcolor: alpha(stat.color, 0.02),
                boxShadow: 'none'
              }}>
                <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(stat.color, 0.1), color: stat.color, display: 'flex' }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Requests List */}
        <Card sx={{ borderRadius: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Recent Requests
            </Typography>
            <Stack direction="row" spacing={1}>
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <Chip
                  key={f}
                  label={f.toUpperCase()}
                  onClick={() => setFilter(f)}
                  color={filter === f ? 'primary' : 'default'}
                  variant={filter === f ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                />
              ))}
            </Stack>
          </Box>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress size={32} /></Box>
            ) : filteredItems.length === 0 ? (
              <Box sx={{ p: 10, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">No records found matching current criteria.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      {role === 'admin' && <TableCell sx={{ fontWeight: 800 }}>Advocate</TableCell>}
                      <TableCell sx={{ fontWeight: 800 }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Days</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      {role === 'admin' && <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {role === 'admin' && (
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.advocateName}</Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ color: 'text.disabled', display: 'flex' }}><CalendarMonth fontSize="small" /></Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.startDate}</Typography>
                              <Typography variant="caption" color="text.secondary">to {item.endDate}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {calculateDays(item.startDate, item.endDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.leaveType} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={item.reason}>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={item.status} />
                        </TableCell>
                        {role === 'admin' && (
                          <TableCell align="right">
                            {item.status === 'pending' ? (
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                  size="small"
                                  startIcon={<CheckCircle />}
                                  variant="outlined"
                                  color="success"
                                  disabled={!!updatingId}
                                  onClick={() => handleUpdate(item.id, 'approved')}
                                  sx={{ fontWeight: 700, borderRadius: 2 }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<Cancel />}
                                  variant="outlined"
                                  color="error"
                                  disabled={!!updatingId}
                                  onClick={() => handleUpdate(item.id, 'rejected')}
                                  sx={{ fontWeight: 700, borderRadius: 2 }}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                Handled on {new Date(item.createdAt).toLocaleDateString()}
                              </Typography>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Request Dialog */}
      <Dialog 
        open={openSubmit} 
        onClose={() => setOpenSubmit(false)}
        PaperProps={{ sx: { borderRadius: 6, p: 2, maxWidth: 500 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Submit Leave Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Please provide details for your absence request. Your administrator will review this shortly.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="From Date"
                  InputLabelProps={{ shrink: true }}
                  value={form.fromDate}
                  onChange={(e) => setForm((s) => ({ ...s, fromDate: e.target.value }))}
                  error={Boolean(errors.fromDate)}
                  helperText={errors.fromDate}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="To Date"
                  InputLabelProps={{ shrink: true }}
                  value={form.toDate}
                  onChange={(e) => setForm((s) => ({ ...s, toDate: e.target.value }))}
                  error={Boolean(errors.toDate)}
                  helperText={errors.toDate}
                />
              </Grid>
            </Grid>

            <TextField
              select
              fullWidth
              label="Leave Type"
              value={form.leaveType}
              onChange={(e) => setForm((s) => ({ ...s, leaveType: e.target.value }))}
            >
              {LEAVE_TYPES.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for Leave"
              placeholder="Briefly explain your reason..."
              value={form.reason}
              onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
              error={Boolean(errors.reason)}
              helperText={errors.reason}
            />

            {form.fromDate && form.toDate && calculateDays(form.fromDate, form.toDate) > 0 && (
              <Alert icon={<Info />} severity="info" sx={{ borderRadius: 3 }}>
                You are requesting <strong>{calculateDays(form.fromDate, form.toDate)} days</strong> of leave.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenSubmit(false)} color="inherit" sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={async () => {
              if (submitting) return;
              if (!validate()) return;
              setSubmitting(true);
              try {
                await LeaveApi.submit({
                  fromDate: form.fromDate,
                  toDate: form.toDate,
                  leaveType: form.leaveType,
                  reason: form.reason,
                });
                setForm({ fromDate: '', toDate: '', reason: '', leaveType: 'Casual' });
                setErrors({});
                setOpenSubmit(false);
                await load();
              } catch (e) {
                alert(e?.response?.data?.error || 'Unable to submit leave request');
              } finally {
                setSubmitting(false);
              }
            }}
            sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
