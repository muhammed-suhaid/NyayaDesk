import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

import { AdvocatesApi } from '../services/api';
import { getRole } from '../auth';
import { isValidEmail, isValidPhoneRequired10Digit, passwordMinLen, required } from '../utils/validation';

export default function AdvocatesPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    barCouncilNumber: '',
    role: 'Advocate',
    status: 'Active',
  });
  const [errors, setErrors] = useState({ name: '', email: '', phone: '', password: '', barCouncilNumber: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, advocate: null });

  const role = getRole();
  const canManageUsers = role === 'admin';

  const validate = () => {
    const next = { name: '', email: '', phone: '', password: '', barCouncilNumber: '' };
    if (!required(form.name)) next.name = 'Name is required';
    if (!required(form.email)) next.email = 'Email is required';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email';
    if (!isValidPhoneRequired10Digit(form.phone)) next.phone = 'Enter a valid 10-digit phone number';
    if (!required(form.password)) next.password = 'Password is required';
    else if (!passwordMinLen(form.password, 6)) next.password = 'Password must be at least 6 characters';
    if (!required(form.barCouncilNumber)) next.barCouncilNumber = 'Bar council number is required';
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const load = async () => {
    const res = await AdvocatesApi.list({ includeWorkload: 1 });
    setItems(res.data);
  };

  const handleDeleteClick = (advocate) => {
    setDeleteConfirm({ open: true, advocate });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.advocate) return;
    
    try {
      await AdvocatesApi.remove(deleteConfirm.advocate.id);
      await load();
      setStatus({ type: 'success', message: 'Advocate deleted successfully' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Delete advocate error:', error);
      setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to delete advocate' });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } finally {
      setDeleteConfirm({ open: false, advocate: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ open: false, advocate: null });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2}>
      {status.message && (
        <Alert severity={status.type} sx={{ mb: 2 }}>
          {status.message}
        </Alert>
      )}
      
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Advocates</Typography>
        {canManageUsers && (
          <Button variant="contained" onClick={() => setOpen(true)}>
            Create Advocate
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Open cases</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.role}</TableCell>
                  <TableCell>{a.status}</TableCell>
                  <TableCell>{a.openCaseCount ?? '-'}</TableCell>
                  <TableCell align="right">
                    {canManageUsers && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(a)}
                      >
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No advocates found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Advocate</DialogTitle>
        <DialogContent>
          {status.message ? <Alert severity={status.type} sx={{ mb: 2 }}>
            {status.message}
          </Alert> : null}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                error={Boolean(errors.name)}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                error={Boolean(errors.phone)}
                helperText={errors.phone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                error={Boolean(errors.email)}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="password"
                label="Password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                error={Boolean(errors.password)}
                helperText={errors.password}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Bar council number"
                value={form.barCouncilNumber}
                onChange={(e) => setForm((s) => ({ ...s, barCouncilNumber: e.target.value }))}
                error={Boolean(errors.barCouncilNumber)}
                helperText={errors.barCouncilNumber}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select label="Role" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Advocate">Advocate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              setStatus({ type: '', message: '' });
              if (!validate()) return;

              try {
                await AdvocatesApi.create({
                  name: form.name.trim(),
                  email: form.email.trim().toLowerCase(),
                  phone: form.phone.trim(),
                  password: form.password,
                  barCouncilNumber: form.barCouncilNumber.trim(),
                });
                setOpen(false);
                setForm({ name: '', phone: '', email: '', password: '', barCouncilNumber: '', role: 'Advocate', status: 'Active' });
                setErrors({ name: '', email: '', phone: '', password: '', barCouncilNumber: '' });
                await load();
              } catch (e) {
                setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to create advocate' });
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete advocate <strong>{deleteConfirm.advocate?.name}</strong>?
          </Typography>
          {deleteConfirm.advocate && deleteConfirm.advocate.openCaseCount > 0 && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
              ⚠️ This advocate is assigned to {deleteConfirm.advocate.openCaseCount} case(s). 
              Please reassign all cases to other advocates first before deleting.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteConfirm.advocate && deleteConfirm.advocate.openCaseCount > 0}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
