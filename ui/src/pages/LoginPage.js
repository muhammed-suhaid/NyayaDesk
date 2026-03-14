import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

import { DEMO_CREDENTIALS, login } from '../auth';
import { isValidEmail, passwordMinLen, required } from '../utils/validation';
import { APP_CONFIG } from '../constants';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const validate = () => {
    const next = { email: '', password: '' };
    if (!required(email)) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email';
    if (!required(password)) next.password = 'Password is required';
    else if (!passwordMinLen(password, 6)) next.password = 'Password must be at least 6 characters';
    setFieldErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const redirectTo = useMemo(() => {
    const from = location.state?.from?.pathname;
    return from && from !== '/login' ? from : '/dashboard';
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    const res = await login(email, password);
    if (!res.ok) {
      setError(res.error || 'Unable to sign in');
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#111111' }}>
      <Container maxWidth="sm">
        <Card sx={{ borderColor: 'rgba(255,255,255,0.14)', bgcolor: 'rgba(255,255,255,0.06)', color: '#ffffff' }}>
          <CardContent>
            <Stack spacing={2.2}>
              <Stack spacing={0.5}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Sign in
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Access your {APP_CONFIG.BRAND_NAME} workspace
                </Typography>
              </Stack>

              {error ? <Alert severity="error">{error}</Alert> : null}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    fullWidth
                    required
                    error={Boolean(fieldErrors.email)}
                    helperText={fieldErrors.email}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                    InputProps={{
                      sx: {
                        color: '#ffffff',
                        '&::placeholder': { color: 'rgba(255,255,255,0.5)' },
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                        '&:hover fieldset': { borderColor: 'rgba(201,162,39,0.7)' },
                        '&.Mui-focused fieldset': { borderColor: '#c9a227' },
                        '&.Mui-error fieldset': { borderColor: '#f44336' },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.8)',
                        '&.Mui-focused': { color: '#c9a227' },
                        '&.Mui-error': { color: '#f44336' },
                      },
                      '& .MuiFormHelperText-root': {
                        color: '#f44336',
                      },
                    }}
                  />
                  <TextField
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    fullWidth
                    required
                    error={Boolean(fieldErrors.password)}
                    helperText={fieldErrors.password}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                    InputProps={{
                      sx: {
                        color: '#ffffff',
                        '&::placeholder': { color: 'rgba(255,255,255,0.5)' },
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                        '&:hover fieldset': { borderColor: 'rgba(201,162,39,0.7)' },
                        '&.Mui-focused fieldset': { borderColor: '#c9a227' },
                        '&.Mui-error fieldset': { borderColor: '#f44336' },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.8)',
                        '&.Mui-focused': { color: '#c9a227' },
                        '&.Mui-error': { color: '#f44336' },
                      },
                      '& .MuiFormHelperText-root': {
                        color: '#f44336',
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{ bgcolor: '#ffffff', color: '#111111', '&:hover': { bgcolor: '#f5f5f5' } }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.14)' }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  New to {APP_CONFIG.BRAND_NAME}?
                </Typography>
                <Button component={RouterLink} to="/register" sx={{ color: '#c9a227' }}>
                  Create Account
                </Button>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEmail(DEMO_CREDENTIALS.admin.email);
                    setPassword(DEMO_CREDENTIALS.admin.password);
                  }}
                  sx={{ borderColor: 'rgba(255,255,255,0.25)', color: '#ffffff' }}
                >
                  Use Sample Admin
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEmail(DEMO_CREDENTIALS.superAdmin.email);
                    setPassword(DEMO_CREDENTIALS.superAdmin.password);
                  }}
                  sx={{ borderColor: 'rgba(255,255,255,0.25)', color: '#ffffff' }}
                >
                  Use Super Admin
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
