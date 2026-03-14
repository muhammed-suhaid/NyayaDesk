import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import { SuperAdminApi } from '../services/api';
import { UI_ACTIONS } from '../constants';

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const res = await SuperAdminApi.companies();
      setCompanies(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Unable to load companies');
      setCompanies([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Typography variant="h5">Admin Portal</Typography>
        <Button variant="contained" sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' } }} onClick={load}>
          {UI_ACTIONS.UPDATE}
        </Button>
      </Stack>

      {error ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={2}>
        {companies.map((c) => (
          <Grid item xs={12} md={6} lg={4} key={c.id}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {c.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={c.status}
                      color={c.status === 'active' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Plan: {c.subscriptionPlan || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Payment: {c.paymentStatus || '-'}
                  </Typography>

                  <Box sx={{ pt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={async () => {
                        await SuperAdminApi.setCompanyStatus(c.id, c.status === 'active' ? 'inactive' : 'active');
                        await load();
                      }}
                    >
                      {c.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {companies.length === 0 && !error ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography>No companies found.</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : null}
      </Grid>
    </Stack>
  );
}
