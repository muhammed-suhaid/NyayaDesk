import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { required, isValidEmail, isValidPhoneOptional10Digit } from '../utils/validation';

import { AdminApi } from '../services/api';

export default function CompanySettings() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  const fetchCompany = async () => {
    try {
      const res = await AdminApi.getCompany();
      const comp = res.data.data.company;
      setCompany(comp);
      setName(comp.name || '');
      setEmail(comp.email || '');
      setPhone(comp.phone || '');
      setAddress(comp.address || '');
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleOpen = () => {
    setStatus({ type: '', message: '' });
    setOpen(true);
  };

  const handleSave = async () => {
    setStatus({ type: '', message: '' });
    const next = {};
    if (!required(name)) next.name = 'Company name is required';
    if (email && !isValidEmail(email)) next.email = 'Enter a valid email';
    if (!isValidPhoneOptional10Digit(phone)) next.phone = 'Enter a valid 10-digit phone number';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await AdminApi.updateCompany({ name, email, phone, address });
      setOpen(false);
      await fetchCompany();
    } catch (e) {
      setStatus({ type: 'error', message: e?.response?.data?.error || 'Failed to update company details' });
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Stack spacing={2}>
      
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                <Typography variant="body1">{company?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{company?.email || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{company?.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography variant="body1">{company?.address || '-'}</Typography>
              </Grid>
            </Grid>
            <Box>
              <Button variant="outlined" onClick={handleOpen}>Edit Company Details</Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Company Details</DialogTitle>
        <DialogContent>
          {status.message ? <Alert severity={status.type} sx={{ mb: 2 }}>{status.message}</Alert> : null}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Company Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
