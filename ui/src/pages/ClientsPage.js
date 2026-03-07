import React, { useEffect, useState } from 'react';
import {
  Alert,
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

export default function ClientsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', district: '' });
  const [errors, setErrors] = useState({ name: '', phone: '', email: '', address: '', district: '' });

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

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Clients</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Client
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>District</TableCell>
                <TableCell>Linked Cases</TableCell>
                <TableCell />
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
                    <Button
                      size="small"
                      color="error"
                      onClick={async () => {
                        await ClientsApi.remove(c.id);
                        await load();
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No clients found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Client</DialogTitle>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Address"
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                error={Boolean(errors.address)}
                helperText={errors.address}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="District"
                value={form.district}
                onChange={(e) => setForm((s) => ({ ...s, district: e.target.value }))}
                error={Boolean(errors.district)}
                helperText={errors.district}
              />
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
                await ClientsApi.create({
                  name: form.name.trim(),
                  phone: form.phone.trim() || null,
                  email: form.email.trim(),
                  address: form.address.trim(),
                  district: form.district.trim(),
                });
                setOpen(false);
                setForm({ name: '', phone: '', email: '', address: '', district: '' });
                setErrors({ name: '', phone: '', email: '', address: '', district: '' });
                await load();
              } catch (e) {
                setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to create client' });
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
