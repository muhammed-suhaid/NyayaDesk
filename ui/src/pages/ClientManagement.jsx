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

import { ClientsApi } from '../services/api';
import { isValidEmail, isValidPhoneOptional10Digit, required } from '../utils/validation';
import { UI_ACTIONS, LEGAL_TERMS } from '../constants';

export default function ClientManagement() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', district: '' });
  const [errors, setErrors] = useState({ name: '', phone: '', email: '', address: '', district: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, client: null });

  const validate = () => {
    const next = { name: '', phone: '', email: '', address: '', district: '' };
    if (!required(form.name)) next.name = 'Name is required';
    if (!required(form.email)) next.email = 'Email is required';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email';
    if (!isValidPhoneOptional10Digit(form.phone)) next.phone = 'Enter a valid 10-digit phone number';
    if (!required(form.address)) next.address = 'Address is required';
    if (!required(form.district)) next.district = 'District is required';
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const load = async () => {
    const res = await ClientsApi.list({ includeCases: 1 });
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (client = null) => {
    setStatus({ type: '', message: '' });
    setErrors({ name: '', phone: '', email: '', address: '', district: '' });
    setEditClient(client);
    if (client) {
      setForm({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        district: client.district || '',
      });
    } else {
      setForm({ name: '', phone: '', email: '', address: '', district: '' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    setStatus({ type: '', message: '' });
    if (!validate()) return;

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim(),
        address: form.address.trim(),
        district: form.district.trim(),
      };

      if (editClient) {
        await ClientsApi.update(editClient.id, payload);
      } else {
        await ClientsApi.create(payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to save client' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.client) return;
    try {
      await ClientsApi.remove(deleteConfirm.client.id);
      await load();
      setStatus({ type: 'success', message: 'Client deleted successfully' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to delete client' });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } finally {
      setDeleteConfirm({ open: false, client: null });
    }
  };

  return (
    <Stack spacing={2}>
      {status.message && (
        <Alert severity={status.type} sx={{ mb: 2 }}>{status.message}</Alert>
      )}
      
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Clients</Typography>
        <Button variant="contained" onClick={() => handleOpen(null)}>{UI_ACTIONS.ADD} Client</Button>
      </Stack>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>{LEGAL_TERMS.DISTRICT}</TableCell>
                <TableCell>Linked Cases</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.phone || '-'}</TableCell>
                  <TableCell>{c.email || '-'}</TableCell>
                  <TableCell>{c.district || '-'}</TableCell>
                  <TableCell>{(c.cases || []).length}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleOpen(c)}>{UI_ACTIONS.EDIT}</Button>
                    <Button size="small" color="error" onClick={() => setDeleteConfirm({ open: true, client: c })}>{UI_ACTIONS.DELETE}</Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No clients found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editClient ? `${UI_ACTIONS.EDIT} Client` : `${UI_ACTIONS.ADD} Client`}</DialogTitle>
        <DialogContent>
          {status.message && <Alert severity={status.type} sx={{ mb: 2 }}>{status.message}</Alert>}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth required label="Name"
                value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                error={Boolean(errors.name)} helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required label="Phone"
                value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                error={Boolean(errors.phone)} helperText={errors.phone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required label="Email"
                value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                error={Boolean(errors.email)} helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth required label="Address"
                value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                error={Boolean(errors.address)} helperText={errors.address}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth required label="District"
                value={form.district} onChange={(e) => setForm((s) => ({ ...s, district: e.target.value }))}
                error={Boolean(errors.district)} helperText={errors.district}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{UI_ACTIONS.CANCEL}</Button>
          <Button variant="contained" onClick={handleSave}>{UI_ACTIONS.SAVE}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, client: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete client <strong>{deleteConfirm.client?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, client: null })}>{UI_ACTIONS.CANCEL}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>{UI_ACTIONS.DELETE}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
