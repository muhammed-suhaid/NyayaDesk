import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  Snackbar,
  Grid,
  Box,
  Divider,
} from '@mui/material';
import { AuthApi } from '../services/api';
import { getCurrentUser, updateProfile as updateLocalProfile } from '../auth';
import { required, isValidPhoneRequired10Digit, passwordMinLen } from '../utils/validation';
import { UI_ACTIONS, FORM_METADATA } from '../constants';

export default function ProfileDialog({ open, onClose }) {
  const user = getCurrentUser();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    barCouncilNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setForm({
          name: currentUser.name || '',
          phone: currentUser.phone || '',
          barCouncilNumber: currentUser.barCouncilNumber || '',
          password: '',
          confirmPassword: '',
        });
        setError(null);
      }
    }
  }, [open]);

  const validate = () => {
    const next = {};
    if (!required(form.name)) next.name = 'Full name is required';
    if (!isValidPhoneRequired10Digit(form.phone)) next.phone = 'Enter a valid 10-digit phone number';
    
    if (user?.role === 'advocate' && !required(form.barCouncilNumber)) {
      next.barCouncilNumber = 'Bar Council Number is required';
    }

    if (form.password) {
      if (!passwordMinLen(form.password, 6)) next.password = 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
      };
      if (form.password) payload.password = form.password;
      if (user.role === 'advocate') payload.barCouncilNumber = form.barCouncilNumber;

      await AuthApi.updateProfile(payload);
      
      // Update local storage
      updateLocalProfile({
        name: form.name,
        phone: form.phone,
        barCouncilNumber: form.barCouncilNumber,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to update all UI components
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>My Profile</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error" size="small">{error}</Alert>}
            
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              Personal Information
            </Typography>

            <TextField
              fullWidth
              label="Full Name"
              size="small"
              value={form.name || ''}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              error={!!errors.name}
              helperText={errors.name}
            />

            <TextField
              fullWidth
              label="Phone Number"
              size="small"
              value={form.phone || ''}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
              error={!!errors.phone}
              helperText={errors.phone}
            />

            {user?.role === 'advocate' && (
              <TextField
                fullWidth
                label="Bar Council Number"
                size="small"
                value={form.barCouncilNumber || ''}
                onChange={(e) => setForm(prev => ({ ...prev, barCouncilNumber: e.target.value }))}
                error={!!errors.barCouncilNumber}
                helperText={errors.barCouncilNumber}
              />
            )}

            <Divider sx={{ my: 1 }} />

            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              Security
            </Typography>

            <TextField
              fullWidth
              label="New Password"
              type="password"
              size="small"
            placeholder={FORM_METADATA.PASSWORD_HINT}
            value={form.password || ''}
            onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
            error={!!errors.password}
            helperText={errors.password}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            size="small"
            value={form.confirmPassword || ''}
            onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>{UI_ACTIONS.CANCEL}</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loading}
          sx={{ fontWeight: 900 }}
        >
          {loading ? UI_ACTIONS.SAVING : UI_ACTIONS.SAVE}
        </Button>
      </DialogActions>
      </Dialog>

      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%', borderRadius: 1.5 }}>
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </>
  );
}
