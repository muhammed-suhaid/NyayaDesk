import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { getCurrentUser, setCurrentUser } from '../auth';
import { AuthApi } from '../services/api';
import { isValidPhoneRequired10Digit, passwordMinLen, required } from '../utils/validation';

export default function ProfilePage() {
  const user = useMemo(() => getCurrentUser(), []);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  const [errors, setErrors] = useState({ name: '', phone: '', password: '', confirmPassword: '' });

  const validate = () => {
    const next = { name: '', phone: '', password: '', confirmPassword: '' };
    if (!required(name)) next.name = 'Name is required';
    if (!isValidPhoneRequired10Digit(phone)) next.phone = 'Enter a valid 10-digit phone number';
    if (password && !passwordMinLen(password, 6)) next.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Profile</Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Account</Typography>

            {status.message ? <Alert severity={status.type}>{status.message}</Alert> : null}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" value={user?.email || ''} disabled />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Role" value={user?.role || ''} disabled />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="New Password (optional)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                />
              </Grid>
            </Grid>

            <Divider />

            <Box>
              <Button
                variant="contained"
                sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' } }}
                onClick={async () => {
                  setStatus({ type: '', message: '' });
                  if (!validate()) return;

                  try {
                    await AuthApi.updateProfile({
                      name: name.trim(),
                      phone: phone.trim(),
                      password: password ? password : undefined,
                    });
                    setPassword('');
                    setConfirmPassword('');
                    setStatus({ type: 'success', message: 'Profile updated' });
                  } catch (e) {
                    setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to update profile' });
                  }
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
