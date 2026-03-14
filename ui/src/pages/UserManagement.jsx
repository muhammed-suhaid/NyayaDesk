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

import { AdminApi } from '../services/api';
import { isValidEmail, isValidPhoneRequired10Digit, passwordMinLen, required } from '../utils/validation';

export default function UserManagement() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
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
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, user: null });

  const validate = () => {
    const next = { name: '', email: '', phone: '', password: '', barCouncilNumber: '' };
    if (!required(form.name)) next.name = 'Name is required';
    if (!required(form.email)) next.email = 'Email is required';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email';
    if (!isValidPhoneRequired10Digit(form.phone)) next.phone = 'Enter a valid 10-digit phone number';
    if (!editUser && !required(form.password)) next.password = 'Password is required';
    else if (form.password && !passwordMinLen(form.password, 6)) next.password = 'Password must be at least 6 characters';
    
    // Bar council required for advocates
    if (form.role === 'Advocate' && !required(form.barCouncilNumber)) next.barCouncilNumber = 'Bar council number is required';
    
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const load = async () => {
    const res = await AdminApi.listUsers();
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (user = null) => {
    setStatus({ type: '', message: '' });
    setErrors({ name: '', email: '', phone: '', password: '', barCouncilNumber: '' });
    setEditUser(user);
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        barCouncilNumber: user.barCouncilNumber || '',
        role: user.role === 'admin' ? 'Admin' : 'Advocate',
        status: user.status === 'inactive' ? 'Inactive' : 'Active',
      });
    } else {
      setForm({ name: '', phone: '', email: '', password: '', barCouncilNumber: '', role: 'Advocate', status: 'Active' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    setStatus({ type: '', message: '' });
    if (!validate()) return;

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
        status: form.status.toLowerCase(),
      };
      if (form.password) payload.password = form.password;
      if (form.role === 'Advocate') payload.barCouncilNumber = form.barCouncilNumber.trim();

      if (editUser) {
        await AdminApi.updateUser(editUser.id, payload);
      } else {
        await AdminApi.createUser(payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to save user' });
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteConfirm({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.user) return;
    try {
      await AdminApi.deleteUser(deleteConfirm.user.id);
      await load();
      setStatus({ type: 'success', message: 'User deleted successfully' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to delete user' });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } finally {
      setDeleteConfirm({ open: false, user: null });
    }
  };

  return (
    <Stack spacing={2}>
      {status.message && (
        <Alert severity={status.type} sx={{ mb: 2 }}>
          {status.message}
        </Alert>
      )}
      
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Users</Typography>
        <Button variant="contained" onClick={() => handleOpen(null)}>
          Add User
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || '-'}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleOpen(u)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteClick(u)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No users found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {status.message && <Alert severity={status.type} sx={{ mb: 2 }}>{status.message}</Alert>}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Name"
                value={form.name || ''}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                error={Boolean(errors.name)}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Email"
                value={form.email || ''}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                error={Boolean(errors.email)}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
               <TextField
                fullWidth
                required
                label="Phone"
                value={form.phone || ''}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                error={Boolean(errors.phone)}
                helperText={errors.phone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required={!editUser}
                type="password"
                label={editUser ? "New Password (optional)" : "Password"}
                value={form.password || ''}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                error={Boolean(errors.password)}
                helperText={errors.password}
              />
            </Grid>
            <Grid item xs={12} md={6}>
               <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select label="Role" value={form.role || 'Advocate'} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Advocate">Advocate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {form.role === 'Advocate' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Bar council number"
                  value={form.barCouncilNumber || ''}
                  onChange={(e) => setForm((s) => ({ ...s, barCouncilNumber: e.target.value }))}
                  error={Boolean(errors.barCouncilNumber)}
                  helperText={errors.barCouncilNumber}
                />
              </Grid>
            )}
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
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, user: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete user <strong>{deleteConfirm.user?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, user: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
