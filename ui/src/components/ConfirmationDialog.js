import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  alpha,
  useTheme
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { UI_ACTIONS } from '../constants';

const ConfirmationDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = UI_ACTIONS.DELETE, 
  cancelText = UI_ACTIONS.CANCEL,
  severity = 'error' // 'error', 'warning', 'info'
}) => {
  const theme = useTheme();
  const color = theme.palette[severity]?.main || theme.palette.error.main;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: 3, maxWidth: 400 }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          bgcolor: alpha(color, 0.1), 
          color: color, 
          p: 1, 
          borderRadius: 2, 
          display: 'flex' 
        }}>
          <WarningAmberRoundedIcon />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <DialogContentText sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.9rem' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'none' }}>
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={severity === 'warning' ? 'warning' : (severity === 'info' ? 'primary' : 'error')}
          sx={{ fontWeight: 900, borderRadius: 2, textTransform: 'none', px: 3 }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
