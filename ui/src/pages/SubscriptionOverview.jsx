import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupsIcon from '@mui/icons-material/Groups';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import StorageIcon from '@mui/icons-material/Storage';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import { SubscriptionApi } from '../services/api';

const STATUS_COLOR = { Active: 'success', Trial: 'warning', Expired: 'error', Cancelled: 'default' };

const LimitItem = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box
      sx={{
        width: 32, height: 32, borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 16, color: '#fff' } })}
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ color: '#fff' }}>
        {value === null ? 'Unlimited' : value}
      </Typography>
    </Box>
  </Stack>
);

export default function SubscriptionOverview({ onPlanChanged }) {
  const [plan, setPlan] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const res = await SubscriptionApi.getCurrent();
      setPlan(res.data.data.subscription);
    } catch {
      showSnack('Failed to load subscription details.', 'error');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await SubscriptionApi.cancel();
      setCancelOpen(false);
      showSnack('Cancellation submitted. Access retained until end of billing cycle.', 'info');
      await load();
      onPlanChanged?.();
    } catch (e) {
      showSnack(e?.response?.data?.error || 'Failed to cancel subscription.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCycleChange = async () => {
    setLoading(true);
    try {
      const newCycle = plan?.billingCycle?.toLowerCase() === 'yearly' ? 'monthly' : 'yearly';
      await SubscriptionApi.changeBillingCycle(newCycle);
      setCycleOpen(false);
      showSnack(`Switched to ${newCycle} billing. Changes apply on next renewal.`, 'success');
    } catch (e) {
      showSnack(e?.response?.data?.error || 'Failed to update billing cycle.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await SubscriptionApi.upgrade('premium');
      setUpgradeOpen(false);
      showSnack('Plan upgrade request submitted!', 'success');
      await load();
      onPlanChanged?.();
    } catch (e) {
      showSnack(e?.response?.data?.error || 'Failed to submit upgrade request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!plan) return null;

  const isYearly = plan.billingCycle?.toLowerCase() === 'yearly';

  return (
    <>
      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
        {/* ── Dark header band ── */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            px: { xs: 3, md: 4 },
            pt: 3.5,
            pb: 4,
          }}
        >
          <Grid container spacing={3} alignItems="flex-start">
            {/* Left: plan title + status */}
            <Grid item xs={12} md={7}>
              <Typography
                variant="overline"
                sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, letterSpacing: 1.5 }}
              >
                Current Plan
              </Typography>

              <Stack direction="row" alignItems="center" spacing={1.5} mt={0.5} mb={1.5} flexWrap="wrap">
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  {plan.planName} Plan
                </Typography>
                {plan.includesAI && (
                  <Chip
                    icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: '#c4b5fd !important' }} />}
                    label="AI Legal Assistant"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(196,181,253,0.18)',
                      color: '#c4b5fd',
                      fontWeight: 700,
                      border: '1px solid rgba(196,181,253,0.35)',
                    }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                  label={plan.status}
                  color={STATUS_COLOR[plan.status] || 'success'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                  {plan.price}
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.45)' }}>
                    {plan.period}
                  </Typography>
                </Typography>
              </Stack>

              <Stack spacing={0.75} mt={2.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    Billing Cycle: <strong style={{ color: '#fff' }}>{plan.billingCycle}</strong>
                  </Typography>
                </Stack>
                {plan.renewalDate && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarTodayIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                      Next billing: <strong style={{ color: '#fff' }}>{plan.renewalDate}</strong>
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Grid>

            {/* Right: limit pills */}
            <Grid item xs={12} md={5}>
              <Typography
                variant="overline"
                sx={{ color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 1.5 }}
              >
                Plan Limits
              </Typography>
              <Stack spacing={1.5} mt={1}>
                <LimitItem icon={<GroupsIcon />} label="Users allowed" value={plan.limits?.users} />
                <LimitItem icon={<FolderCopyIcon />} label="Cases" value={plan.limits?.cases} />
                <LimitItem icon={<StorageIcon />} label="Storage" value={plan.limits?.storage} />
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* ── Action row ── */}
        <CardContent sx={{ px: { xs: 3, md: 4 }, py: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<ArrowUpwardIcon />}
              onClick={() => setUpgradeOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Upgrade Plan
            </Button>
            <Button
              variant="outlined"
              startIcon={<SwapHorizIcon />}
              onClick={() => setCycleOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Change Billing Cycle
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelOutlinedIcon />}
              onClick={() => setCancelOpen(true)}
              disabled={plan.status === 'Cancelled'}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Cancel Subscription
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Upgrade dialog ── */}
      <Dialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Upgrade Plan</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are on the <strong>{plan.planName}</strong> plan. Upgrading will switch you to the <strong>Premium</strong> plan immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={handleUpgrade} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Confirm Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Change billing cycle dialog ── */}
      <Dialog open={cycleOpen} onClose={() => setCycleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Billing Cycle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Switch to <strong>{isYearly ? 'Monthly' : 'Yearly'} billing</strong>.
            {!isYearly && ' Save up to 20% with yearly billing. Your plan will be prorated automatically.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCycleOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={handleCycleChange} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : `Switch to ${isYearly ? 'Monthly' : 'Yearly'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel subscription dialog ── */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your subscription? You will retain full access until <strong>{plan.renewalDate || 'end of billing cycle'}</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={loading}>Keep Subscription</Button>
          <Button color="error" variant="contained" onClick={handleCancel} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
