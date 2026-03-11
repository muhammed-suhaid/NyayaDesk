import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const MOCK_CARDS = [
  { id: 1, type: 'Visa', last4: '4821', expiry: '04/2028', isDefault: true },
  { id: 2, type: 'Mastercard', last4: '3317', expiry: '11/2026', isDefault: false },
];

const BRAND_COLORS = {
  Visa: '#1a1f71',
  Mastercard: '#eb001b',
  default: '#6b7280',
};

export default function PaymentMethods() {
  const [cards, setCards] = useState(MOCK_CARDS);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [newCard, setNewCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({});

  const handleAdd = () => {
    const e = {};
    if (!newCard.number || newCard.number.replace(/\s/g, '').length < 16) e.number = 'Enter a valid 16-digit card number';
    if (!newCard.name) e.name = 'Cardholder name is required';
    if (!newCard.expiry || !/^\d{2}\/\d{2}$/.test(newCard.expiry)) e.expiry = 'Enter expiry as MM/YY';
    if (!newCard.cvv || newCard.cvv.length < 3) e.cvv = 'Enter a valid CVV';
    setErrors(e);
    if (Object.keys(e).length) return;

    const last4 = newCard.number.replace(/\s/g, '').slice(-4);
    setCards((prev) => [
      ...prev,
      { id: Date.now(), type: 'Visa', last4, expiry: newCard.expiry, isDefault: prev.length === 0 },
    ]);
    setNewCard({ number: '', name: '', expiry: '', cvv: '' });
    setErrors({});
    setAddOpen(false);
    setSnack({ open: true, message: 'Payment method added successfully', severity: 'success' });
  };

  const handleDelete = () => {
    setCards((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    setSnack({ open: true, message: 'Payment method removed', severity: 'info' });
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>Payment Methods</Typography>
        <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => setAddOpen(true)}>
          Add Payment Method
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {cards.map((card, i) => (
            <Box key={card.id}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 3, py: 2.5 }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: BRAND_COLORS[card.type] || BRAND_COLORS.default,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCardIcon sx={{ color: '#fff', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1" fontWeight={600}>
                        {card.type} ending in {card.last4}
                      </Typography>
                      {card.isDefault && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            bgcolor: '#dbeafe',
                            color: '#1d4ed8',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                          }}
                        >
                          DEFAULT
                        </Box>
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Expires {card.expiry}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Update card">
                    <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Remove card">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(card.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              {i < cards.length - 1 && <Divider />}
            </Box>
          ))}
          {cards.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CreditCardIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No payment methods saved.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                inputProps={{ maxLength: 19 }}
                value={newCard.number}
                onChange={(e) => setNewCard((s) => ({ ...s, number: formatCardNumber(e.target.value) }))}
                error={Boolean(errors.number)}
                helperText={errors.number}
                placeholder="1234 5678 9012 3456"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={newCard.name}
                onChange={(e) => setNewCard((s) => ({ ...s, name: e.target.value }))}
                error={Boolean(errors.name)}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry (MM/YY)"
                value={newCard.expiry}
                placeholder="MM/YY"
                inputProps={{ maxLength: 5 }}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                  setNewCard((s) => ({ ...s, expiry: val }));
                }}
                error={Boolean(errors.expiry)}
                helperText={errors.expiry}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                type="password"
                inputProps={{ maxLength: 4 }}
                value={newCard.cvv}
                onChange={(e) => setNewCard((s) => ({ ...s, cvv: e.target.value.replace(/\D/g, '') }))}
                error={Boolean(errors.cvv)}
                helperText={errors.cvv}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddOpen(false); setErrors({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Save Card</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Payment Method</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this payment method?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
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
