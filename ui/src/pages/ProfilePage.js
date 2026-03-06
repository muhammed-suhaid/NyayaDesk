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

import { getAuth, updateProfile } from '../auth';

export default function ProfilePage() {
  const auth = useMemo(() => getAuth(), []);

  const [name, setName] = useState(auth?.name || '');
  const [phone, setPhone] = useState(auth?.phone || '');
  const [status, setStatus] = useState({ type: '', message: '' });

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
                <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" value={auth?.email || ''} disabled />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Role" value={auth?.role || ''} disabled />
              </Grid>
            </Grid>

            <Divider />

            <Box>
              <Button
                variant="contained"
                sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' } }}
                onClick={() => {
                  const res = updateProfile({ name, phone });
                  if (!res.ok) {
                    setStatus({ type: 'error', message: res.error || 'Unable to update profile' });
                    return;
                  }
                  setStatus({ type: 'success', message: 'Profile updated' });
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
