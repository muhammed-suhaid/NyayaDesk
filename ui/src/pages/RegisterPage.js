import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { registerUser } from '../auth';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Advocate',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const onChange = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const res = registerUser({
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      password: form.password,
    });

    if (!res.ok) {
      setError(res.error || 'Unable to create account');
      return;
    }

    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#111111' }}>
      <Container maxWidth="sm">
        <Card sx={{ borderColor: 'rgba(255,255,255,0.14)', bgcolor: 'rgba(255,255,255,0.06)', color: '#ffffff' }}>
          <CardContent>
            <Stack spacing={2.2}>
              <Stack spacing={0.5}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Create account
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Register a demo user (stored locally)
                </Typography>
              </Stack>

              {error ? <Alert severity="error">{error}</Alert> : null}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Name"
                      value={form.name}
                      onChange={onChange('name')}
                      fullWidth
                      required
                      InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                          '&:hover fieldset': { borderColor: 'rgba(201,162,39,0.7)' },
                          '&.Mui-focused fieldset': { borderColor: '#c9a227' },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email"
                      value={form.email}
                      onChange={onChange('email')}
                      type="email"
                      fullWidth
                      required
                      InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                          '&:hover fieldset': { borderColor: 'rgba(201,162,39,0.7)' },
                          '&.Mui-focused fieldset': { borderColor: '#c9a227' },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Phone"
                      value={form.phone}
                      onChange={onChange('phone')}
                      fullWidth
                      InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                          '&:hover fieldset': { borderColor: 'rgba(201,162,39,0.7)' },
                          '&.Mui-focused fieldset': { borderColor: '#c9a227' },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Role</InputLabel>
                      <Select
                        label="Role"
                        value={form.role}
                        onChange={onChange('role')}
                        sx={{
                          color: '#ffffff',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(201,162,39,0.7)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#c9a227' },
                          '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.8)' },
                        }}
                      >
                        <MenuItem value="Admin">Admin</MenuItem>
                        <MenuItem value="Advocate">Advocate</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Password"
                      value={form.password}
                      onChange={onChange('password')}
                      type="password"
                      fullWidth
                      required
                      InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                          '&:hover fieldset': { borderColor: 'rgba(201,162,39,0.7)' },
                          '&.Mui-focused fieldset': { borderColor: '#c9a227' },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Confirm Password"
                      value={form.confirmPassword}
                      onChange={onChange('confirmPassword')}
                      type="password"
                      fullWidth
                      required
                      InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                          '&:hover fieldset': { borderColor: 'rgba(201,162,39,0.7)' },
                          '&.Mui-focused fieldset': { borderColor: '#c9a227' },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{ bgcolor: '#ffffff', color: '#111111', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      Create Account
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.14)' }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Already have an account?
                </Typography>
                <Button component={RouterLink} to="/login" sx={{ color: '#c9a227' }}>
                  Sign In
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button component={RouterLink} to="/" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Back to home
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
