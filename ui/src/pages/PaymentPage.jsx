import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SubscriptionApi } from '../services/api';

const PLAN_COLORS = { free: '#6b7280', standard: '#3b82f6', premium: '#7c3aed' };

// Detect card brand from first digits
function detectCardBrand(num) {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n))         return { name: 'Visa',       color: '#1a1f71' };
  if (/^5[1-5]/.test(n))   return { name: 'Mastercard', color: '#eb001b' };
  if (/^3[47]/.test(n))    return { name: 'Amex',       color: '#2e77bc' };
  if (/^6/.test(n))        return { name: 'RuPay',      color: '#1e7e34' };
  return null;
}

// Format card number as XXXX XXXX XXXX XXXX
function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

// Format expiry as MM/YY
function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

// Mask card for summary display
function maskCard(num) {
  const d = num.replace(/\s/g, '');
  return d.length >= 4 ? '**** **** **** ' + d.slice(-4) : '';
}

// Validate expiry is a future date
function isExpiryValid(val) {
  const [mm, yy] = val.split('/');
  if (!mm || !yy) return false;
  const now = new Date();
  const exp = new Date(2000 + parseInt(yy), parseInt(mm) - 1, 1);
  return exp > now;
}

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan') || '';

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [error, setError] = useState('');

  // Card form state
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const brand = detectCardBrand(card.number);
  const color = PLAN_COLORS[planId] || '#3b82f6';

  useEffect(() => {
    (async () => {
      try {
        const res = await SubscriptionApi.getPlans();
        const found = (res.data.data.plans || []).find((p) => p.id === planId);
        if (!found || found.id === 'free') {
          setError('Invalid plan. Please go back and choose a plan.');
        } else {
          setPlan(found);
        }
      } catch {
        setError('Could not load plan details. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [planId]);

  const validate = () => {
    const e = {};
    if (card.number.replace(/\s/g, '').length < 16) e.number = 'Enter a valid 16-digit card number';
    if (!card.name.trim()) e.name = 'Cardholder name is required';
    if (!isExpiryValid(card.expiry)) e.expiry = 'Enter a valid future expiry (MM/YY)';
    if (card.cvv.length < 3) e.cvv = 'CVV must be 3–4 digits';
    return e;
  };

  const handlePay = async () => {
    const errs = validate();
    setFieldErrors(errs);
    setTouched({ number: true, name: true, expiry: true, cvv: true });
    if (Object.keys(errs).length) return;

    // Step 1: Show processing animation
    setStep('processing');
    setError('');

    try {
      // Simulate processing delay before calling backend
      await new Promise((r) => setTimeout(r, 2200));
      await SubscriptionApi.activate(planId);
      setStep('success');
      setTimeout(() => navigate('/settings'), 2000);
    } catch (e) {
      setStep('form');
      setError(e?.response?.data?.error || 'Payment failed. Please try again.');
    }
  };

  const field = (key) => ({
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    error: touched[key] && Boolean(fieldErrors[key]),
    helperText: touched[key] ? fieldErrors[key] : '',
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ── Processing ────────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <Box sx={{ maxWidth: 420, mx: 'auto', py: 10, px: 2, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
          <CircularProgress size={72} thickness={3} sx={{ color }} />
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockIcon sx={{ color, fontSize: 28 }} />
          </Box>
        </Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>Processing Payment…</Typography>
        <Typography variant="body2" color="text.secondary">
          Securely verifying your card details. Please do not close this page.
        </Typography>
        {card.number && (
          <Chip
            label={maskCard(card.number)}
            icon={<CreditCardIcon />}
            sx={{ mt: 3, fontFamily: 'monospace', fontWeight: 600 }}
          />
        )}
      </Box>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Box sx={{ maxWidth: 420, mx: 'auto', py: 8, px: 2, textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={800} gutterBottom>Payment Successful!</Typography>
        <Typography color="text.secondary" mb={1}>
          Your <strong>{plan?.name}</strong> plan has been activated.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Redirecting to Settings…
        </Typography>
        <CircularProgress size={18} sx={{ display: 'block', mx: 'auto', mt: 2 }} />
      </Box>
    );
  }

  // ── Payment Form ──────────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', py: 4, px: 2 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/settings')}
        sx={{ mb: 3, textTransform: 'none' }}
      >
        Back to Settings
      </Button>

      <Grid container spacing={3}>
        {/* ── Left: form ── */}
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Secure Payment
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75} mb={3}>
            <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              256-bit SSL encrypted · Test mode
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* ── Order summary ── */}
          <Card
            sx={{
              borderRadius: 3,
              border: `1.5px solid ${color}`,
              mb: 3,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ background: `linear-gradient(135deg, #1e1b4b 0%, ${color} 100%)`, px: 2.5, py: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#fff' }}>
                    {plan?.name} Plan
                  </Typography>
                  {plan?.includesAI && <AutoAwesomeIcon sx={{ color: '#c4b5fd', fontSize: 16 }} />}
                </Stack>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
                  ₹{plan?.price?.toLocaleString('en-IN')}
                  <Typography component="span" variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', ml: 0.5 }}>
                    /mo
                  </Typography>
                </Typography>
              </Stack>
            </Box>
          </Card>

          {/* ── Card details form ── */}
          <Card sx={{ borderRadius: 3, p: 0 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                CARD DETAILS
              </Typography>

              {/* Card number */}
              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                inputProps={{ maxLength: 19, inputMode: 'numeric' }}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCardIcon sx={{ color: brand?.color || 'action.active' }} />
                    </InputAdornment>
                  ),
                  endAdornment: brand && (
                    <InputAdornment position="end">
                      <Typography variant="caption" fontWeight={700} sx={{ color: brand.color }}>
                        {brand.name}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                {...field('number')}
              />

              {/* Cardholder name */}
              <TextField
                fullWidth
                label="Cardholder Name"
                placeholder="Name as on card"
                value={card.name}
                onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                sx={{ mb: 2 }}
                {...field('name')}
              />

              {/* Expiry + CVV */}
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Expiry (MM/YY)"
                    placeholder="MM/YY"
                    value={card.expiry}
                    inputProps={{ maxLength: 5, inputMode: 'numeric' }}
                    onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    {...field('expiry')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    placeholder="•••"
                    type="password"
                    value={card.cvv}
                    inputProps={{ maxLength: 4, inputMode: 'numeric' }}
                    onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <LockIcon sx={{ fontSize: 16, color: 'action.active' }} />
                        </InputAdornment>
                      ),
                    }}
                    {...field('cvv')}
                  />
                </Grid>
              </Grid>

              {/* Test card hint */}
              <Box
                sx={{
                  mt: 1.5, mb: 2.5, px: 2, py: 1.5, borderRadius: 2,
                  bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200',
                  bgcolor: '#eff6ff', borderColor: '#bfdbfe',
                }}
              >
                <Typography variant="caption" color="primary" fontWeight={600}>
                  Test card: &nbsp;
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>4111 1111 1111 1111</Box>
                  &nbsp; · Expiry: 12/26 · CVV: 123
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Total + Pay button */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body1" fontWeight={600}>Total due today</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color }}>
                  ₹{plan?.price?.toLocaleString('en-IN')}
                </Typography>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePay}
                disabled={!plan || !!error}
                startIcon={<LockIcon />}
                sx={{
                  borderRadius: 2, fontWeight: 700, fontSize: '1rem', py: 1.5,
                  bgcolor: color,
                  '&:hover': { bgcolor: color, filter: 'brightness(0.92)' },
                }}
              >
                Pay ₹{plan?.price?.toLocaleString('en-IN')}
              </Button>

              <Stack direction="row" justifyContent="center" spacing={0.5} mt={1.5}>
                <LockIcon sx={{ fontSize: 13, color: 'text.disabled', my: 'auto' }} />
                <Typography variant="caption" color="text.secondary">
                  Secured by SSL · No real payment processed in test mode
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
