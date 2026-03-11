import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { SubscriptionApi } from '../services/api';

export default function PlanComparison({ currentPlanId: propPlanId }) {
  const [plans, setPlans] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [currentPlanId, setCurrentPlanId] = useState(propPlanId || null);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const [plansRes, currentRes] = await Promise.all([
        SubscriptionApi.getPlans(),
        SubscriptionApi.getCurrent(),
      ]);
      setPlans(plansRes.data.data.plans || []);
      setCurrentPlanId(currentRes.data.data.subscription?.planId || 'free');
    } catch {
      setSnack({ open: true, message: 'Could not load plans.', severity: 'error' });
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await SubscriptionApi.upgrade(upgradeTarget.id);
      setSnack({ open: true, message: `Switched to ${upgradeTarget.name} plan.`, severity: 'success' });
      setUpgradeTarget(null);
      await load();
    } catch (e) {
      setSnack({ open: true, message: e?.response?.data?.error || 'Failed to change plan.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const PLAN_COLORS = { free: '#6b7280', standard: '#3b82f6', premium: '#7c3aed' };

  if (fetching) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Available Plans
      </Typography>

      <Grid container spacing={3}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const color = PLAN_COLORS[plan.id] || '#6b7280';
          return (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: isCurrent ? `2px solid ${color}` : '1px solid #e5e7eb',
                  position: 'relative',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                {isCurrent && (
                  <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <Chip
                      label="Current Plan"
                      size="small"
                      sx={{ bgcolor: color, color: '#fff', fontWeight: 700 }}
                    />
                  </Box>
                )}

                <CardHeader
                  title={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" fontWeight={700}>{plan.name}</Typography>
                      {plan.includesAI && (
                        <AutoAwesomeIcon sx={{ color, fontSize: 18 }} />
                      )}
                    </Stack>
                  }
                  subheader={
                    <Stack direction="row" alignItems="baseline" spacing={0.5} mt={0.5}>
                      <Typography variant="h4" fontWeight={800} sx={{ color }}>
                        {plan.price === 0 ? '₹0' : `₹${plan.price.toLocaleString('en-IN')}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {plan.period}
                      </Typography>
                    </Stack>
                  }
                  sx={{ pb: 0 }}
                />

                <CardContent>
                  <List dense disablePadding>
                    {(plan.features || []).map((f) => (
                      <ListItem key={f} disableGutters sx={{ py: 0.4 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckIcon sx={{ fontSize: 16, color }} />
                        </ListItemIcon>
                        <ListItemText primary={<Typography variant="body2">{f}</Typography>} />
                      </ListItem>
                    ))}
                    {plan.includesAI && (
                      <ListItem disableGutters sx={{ pt: 1 }}>
                        <Chip
                          icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                          label="Includes AI Legal Assistant"
                          size="small"
                          sx={{ bgcolor: '#ede9fe', color, fontWeight: 600 }}
                        />
                      </ListItem>
                    )}
                  </List>

                  <Box mt={2.5}>
                    {isCurrent ? (
                      <Button fullWidth variant="contained" disabled sx={{ borderRadius: 2 }}>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant={plan.id === 'premium' ? 'contained' : 'outlined'}
                        sx={{
                          borderRadius: 2,
                          borderColor: color,
                          color: plan.id === 'premium' ? '#fff' : color,
                          bgcolor: plan.id === 'premium' ? color : 'transparent',
                          '&:hover': { bgcolor: color, color: '#fff', borderColor: color },
                        }}
                        onClick={() => setUpgradeTarget(plan)}
                      >
                        {plan.price < (plans.find((p) => p.id === currentPlanId)?.price || 0)
                          ? 'Downgrade'
                          : 'Upgrade'} to {plan.name}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Upgrade Confirm Dialog */}
      <Dialog open={Boolean(upgradeTarget)} onClose={() => setUpgradeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Plan Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to switch to the <strong>{upgradeTarget?.name} Plan</strong>. Billing will be adjusted on your next invoice date. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeTarget(null)} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={handleUpgrade} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
