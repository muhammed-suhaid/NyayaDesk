import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Button,
  Chip
} from '@mui/material';

export default function SubscriptionSettings() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Current Plan
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You are currently on the <strong>Premium</strong> plan.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Typography variant="body2">Status:</Typography>
                <Chip label="Active" color="success" size="small" />
              </Stack>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Billing cycle: <strong>Monthly</strong>
              </Typography>
              <Typography variant="body2">
                Renewal date: <strong>{new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
              <Button variant="contained" color="primary" sx={{ mr: 1 }}>
                Upgrade Plan
              </Button>
              <Button variant="outlined" color="error">
                Cancel Subscription
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Typography variant="caption" color="text.secondary">
        Mock representation - to be connected to subscription API.
      </Typography>
    </Stack>
  );
}
