import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import { SubscriptionApi } from '../services/api';

const statusProps = (s) => ({
  color: s === 'Paid' ? 'success' : s === 'Pending' ? 'warning' : 'default',
  variant: 'outlined',
});

export default function BillingHistory() {
  const [invoices, setInvoices] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const res = await SubscriptionApi.getInvoices();
      setInvoices(res.data.data.invoices || []);
    } catch {
      setError('Could not load billing history.');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async (invoice) => {
    setDownloading(invoice.id);
    try {
      const res = await SubscriptionApi.downloadInvoice(invoice.id);
      // In production, open the downloadUrl or trigger PDF download
      const url = res.data.data?.downloadUrl;
      if (url) {
        window.open(url, '_blank');
      } else {
        alert(`Invoice ${invoice.invoiceId} download — PDF generation coming soon.`);
      }
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>Billing History</Typography>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {fetching ? (
            <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : invoices.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <ReceiptLongIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No invoices yet.</Typography>
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
                  <TableCell sx={{ fontWeight: 700 }} align="right">Download</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell><Typography variant="body2">{inv.date}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                        {inv.invoiceId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{inv.plan}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{inv.amount}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={inv.status} size="small" {...statusProps(inv.status)} />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={
                          downloading === inv.id
                            ? <CircularProgress size={14} />
                            : <DownloadIcon />
                        }
                        onClick={() => handleDownload(inv)}
                        disabled={downloading === inv.id}
                        sx={{ textTransform: 'none' }}
                      >
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
