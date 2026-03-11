import React, { useCallback, useEffect, useState } from 'react';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate } from 'react-router-dom';
import { SubscriptionApi, AdminApi } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Plan Colours
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_COLORS = { free: '#6b7280', standard: '#3b82f6', premium: '#7c3aed' };
const STATUS_COLOR = { Active: 'success', Trial: 'warning', Expired: 'error', Cancelled: 'default' };


export default function SubscriptionSettings() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subRes, plansRes, invRes, compRes] = await Promise.all([
        SubscriptionApi.getCurrent(),
        SubscriptionApi.getPlans(),
        SubscriptionApi.getInvoices(),
        AdminApi.getCompany(),
      ]);
      setCurrentPlan(subRes.data.data.subscription);
      setPlans(plansRes.data.data.plans || []);
      setInvoices(invRes.data.data.invoices || []);
      setCompany(compRes.data.data.company);
    } catch {
      setError('Failed to load subscription data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePurchase = (plan) => {
    navigate(`/payment?plan=${plan.id}`);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset subscription to Free for testing? This will clear active plan data.')) return;
    setResetting(true);
    try {
      await SubscriptionApi.reset();
      await load();
    } catch (err) {
      alert('Failed to reset: ' + (err.response?.data?.error || err.message));
    } finally {
      setResetting(false);
    }
  };

  const handlePrintAll = () => window.print();

  const handlePrintInvoice = (invoice) => {
    const win = window.open('', '_blank', 'width=820,height=650');
    if (!win) {
      alert('Popup was blocked. Please allow popups for this site to print invoices.');
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceId} — NyayaDesk</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1f2937; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
          .logo-box { }
          .logo { font-size: 24px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.02em; }
          .logo span { display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
          .invoice-meta { text-align: right; }
          .invoice-meta h1 { font-size: 28px; color: #1e1b4b; margin-bottom: 8px; font-weight: 800; }
          .invoice-meta p { color: #4b5563; font-size: 13px; margin-top: 2px; }
          .address-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .address-box h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .address-box p { font-size: 13px; color: #1f2937; margin-bottom: 4px; }
          .address-box strong { display: block; font-size: 15px; margin-bottom: 4px; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f9fafb; text-align: left; padding: 12px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
          td { padding: 16px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
          .item-desc { font-weight: 600; color: #111827; margin-bottom: 4px; }
          .item-sub { font-size: 12px; color: #6b7280; }
          .status-paid { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .summary-section { margin-top: 20px; display: flex; justify-content: flex-end; }
          .summary-table { width: 300px; }
          .summary-table tr td { padding: 8px 14px; border: none; }
          .summary-table tr td:first-child { color: #6b7280; text-align: right; }
          .summary-table tr td:last-child { color: #111827; text-align: right; font-weight: 600; }
          .summary-table tr.grand-total td { font-size: 18px; font-weight: 800; border-top: 2px solid #1e1b4b; padding-top: 15px; color: #1e1b4b; }
          .footer { margin-top: 80px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
          .payment-info { margin-top: 40px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .payment-info h4 { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.03em; }
          .payment-info p { font-size: 12px; color: #334155; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <div class="logo">NyayaDesk<span>Legal Case Management Solutions</span></div>
          </div>
          <div class="invoice-meta">
            <h1>INVOICE</h1>
            <p><strong>Invoice No:</strong> ${invoice.invoiceId}</p>
            <p><strong>Date:</strong> ${invoice.date}</p>
          </div>
        </div>

        <div class="address-section">
          <div class="address-box">
            <h3>From</h3>
            <strong>NyayaDesk Support</strong>
            <p>Email: support@nyayadesk.com</p>
            <p>Phone: +91 98765 43210</p>
            <p>Web: www.nyayadesk.com</p>
          </div>
          <div class="address-box">
            <h3>Bill To</h3>
            <strong>${company?.name || 'Customer'}</strong>
            <p>${company?.address || 'No Address Provided'}</p>
            <p>${company?.phone || 'No Phone'}</p>
            <p>${company?.email || 'No Email'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%">Description</th>
              <th>Plan Type</th>
              <th style="text-align: right">Price</th>
              <th style="text-align: right">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="item-desc">NyayaDesk SaaS Subscription</div>
                <div class="item-sub">One month access to legal case management tools, documents, and dashboard for ${company?.name || 'your firm'}.</div>
              </td>
              <td style="text-transform:capitalize">${invoice.plan}</td>
              <td style="text-align: right">${invoice.amount}</td>
              <td style="text-align: right"><span class="status-paid">${invoice.status}</span></td>
            </tr>
          </tbody>
        </table>

        <div class="summary-section">
          <table class="summary-table">
            <tr>
              <td>Subtotal</td>
              <td>${invoice.amount}</td>
            </tr>
            <tr>
              <td>Tax (0%)</td>
              <td>₹0.00</td>
            </tr>
            <tr class="grand-total">
              <td>Total</td>
              <td>${invoice.amount}</td>
            </tr>
          </table>
        </div>

        <div class="payment-info">
          <h4>Payment Method</h4>
          <p>Visa ending with 4111 (Processed securely via Demo Payment Gateway)</p>
          <p style="margin-top: 4px; color: #64748b; font-style: italic;">Transaction Reference: NYD-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
        </div>

        <div class="footer">
          <p>Thank you for choosing NyayaDesk. We appreciate your business!</p>
          <p style="margin-top: 8px;">Support: +91 98765-43210 | support@nyayadesk.com | www.nyayadesk.com</p>
          <p style="margin-top: 8px; font-size: 10px; color: #d1d5db;">This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    // Small delay so the popup has time to render before print dialog
    setTimeout(() => { win.print(); }, 400);
  };

  // ── Loading / Error ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  const hasActivePlan = currentPlan?.isActive && currentPlan?.planId !== 'free';

  return (
    <Stack spacing={4}>

      {/* ── 1. Current Plan ─────────────────────────────────────────────── */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="h6" fontWeight={700}>Current Plan</Typography>
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={handleReset}
            disabled={resetting}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            {resetting ? 'Resetting...' : 'Reset for Testing'}
          </Button>
        </Stack>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: `2px solid ${PLAN_COLORS[currentPlan?.planId] || '#6b7280'}`,
            boxShadow: 2,
          }}
        >
          {/* Dark header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, #1e1b4b 0%, ${PLAN_COLORS[currentPlan?.planId] || '#6b7280'} 100%)`,
              px: 3, py: 3,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                  <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                    {currentPlan?.planName || 'Free'} Plan
                  </Typography>
                  {currentPlan?.includesAI && (
                    <Chip
                      icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: '#c4b5fd !important' }} />}
                      label="AI Legal Assistant"
                      size="small"
                      sx={{ bgcolor: 'rgba(196,181,253,0.2)', color: '#c4b5fd', fontWeight: 700, border: '1px solid rgba(196,181,253,0.3)' }}
                    />
                  )}
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                  {currentPlan?.price} {currentPlan?.period !== 'forever' ? `· ${currentPlan?.period}` : ''}
                </Typography>
              </Box>
              <Chip
                label={currentPlan?.status || 'Free'}
                color={STATUS_COLOR[currentPlan?.status] || 'default'}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Box>

          {/* Plan details */}
          <CardContent sx={{ px: 3, py: 2.5 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>BILLING CYCLE</Typography>
                <Typography variant="body1" fontWeight={600}>{currentPlan?.billingCycle || 'N/A'}</Typography>
              </Grid>
              {currentPlan?.renewalDate && currentPlan?.billingCycle !== 'N/A' && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>NEXT RENEWAL</Typography>
                  <Typography variant="body1" fontWeight={600}>{currentPlan.renewalDate}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>USER LIMIT</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {currentPlan?.limits?.users === null ? 'Unlimited' : currentPlan?.limits?.users}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>CASE LIMIT</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {currentPlan?.limits?.cases === null ? 'Unlimited' : currentPlan?.limits?.cases}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>STORAGE</Typography>
                <Typography variant="body1" fontWeight={600}>{currentPlan?.limits?.storage}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Divider />

      {/* ── 2. Available Plans ───────────────────────────────────────────── */}
      <Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>Available Plans</Typography>
        <Grid container spacing={3}>
          {plans.map((plan) => {
            const color = PLAN_COLORS[plan.id] || '#6b7280';
            const isCurrentActive = plan.isCurrent && currentPlan?.isActive;
            // Lock all purchase buttons when ANY paid plan is active
            const hasActivePlan = currentPlan?.isActive && currentPlan?.planId !== 'free';

            return (
              <Grid item xs={12} md={4} key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: isCurrentActive ? `2px solid ${color}` : '1px solid #e5e7eb',
                    position: 'relative',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: plan.id !== 'free' ? 4 : 1 },
                  }}
                >
                  {isCurrentActive && (
                    <Box sx={{ position: 'absolute', top: 14, right: 14 }}>
                      <Chip label="Active Plan" size="small" sx={{ bgcolor: color, color: '#fff', fontWeight: 700 }} />
                    </Box>
                  )}

                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="h6" fontWeight={700}>{plan.name}</Typography>
                      {plan.includesAI && <AutoAwesomeIcon sx={{ color, fontSize: 18 }} />}
                    </Stack>

                    <Stack direction="row" alignItems="baseline" spacing={0.5} mb={2}>
                      <Typography variant="h4" fontWeight={800} sx={{ color }}>
                        {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                      </Typography>
                      {plan.price > 0 && (
                        <Typography variant="caption" color="text.secondary">{plan.period}</Typography>
                      )}
                    </Stack>

                    <List dense disablePadding sx={{ mb: 2.5 }}>
                      {(plan.features || []).map((f) => (
                        <ListItem key={f} disableGutters sx={{ py: 0.3 }}>
                          <ListItemIcon sx={{ minWidth: 26 }}>
                            <CheckIcon sx={{ fontSize: 15, color }} />
                          </ListItemIcon>
                          <ListItemText primary={<Typography variant="body2">{f}</Typography>} />
                        </ListItem>
                      ))}
                    </List>

                    {/* Button logic:
                        - Free → always "Always Free" (disabled)
                        - Current active plan → "Current Plan" (disabled)
                        - Any other plan, active subscription exists → disabled
                        - No active paid plan → Purchase button enabled */}
                    {plan.id === 'free' ? (
                      <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 2 }}>
                        Always Free
                      </Button>
                    ) : isCurrentActive ? (
                      <Button fullWidth variant="contained" disabled sx={{ borderRadius: 2 }}>
                        ✓ Current Plan
                      </Button>
                    ) : hasActivePlan ? (
                      <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 2 }}>
                        Unavailable
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          borderRadius: 2, fontWeight: 700,
                          bgcolor: color,
                          '&:hover': { bgcolor: color, filter: 'brightness(0.92)' },
                        }}
                        onClick={() => handlePurchase(plan)}
                      >
                        Purchase {plan.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Divider />

      {/* ── 3. Billing History ───────────────────────────────────────────── */}
      <Box>
        <Typography variant="h6" fontWeight={700} mb={2}>Billing History</Typography>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {invoices.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography color="text.secondary">No billing records yet.</Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Print</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                          {inv.invoiceId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{inv.plan}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{inv.amount}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={inv.status}
                          size="small"
                          color={inv.status === 'Paid' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<PrintIcon />}
                          sx={{ textTransform: 'none' }}
                          onClick={() => handlePrintInvoice(inv)}
                        >
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>

    </Stack>
  );
}
