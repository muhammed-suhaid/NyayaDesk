import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  alpha,
  useTheme,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import PeopleIcon from '@mui/icons-material/People';
import GavelIcon from '@mui/icons-material/Gavel';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import RefreshIcon from '@mui/icons-material/Refresh';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentsIcon from '@mui/icons-material/Payments';
import DownloadIcon from '@mui/icons-material/Download';
import ConfirmationDialog from '../components/ConfirmationDialog';

import { SuperAdminApi } from '../services/api';
import { UI_ACTIONS, LEGAL_TERMS, COMMON_FIELDS } from '../constants';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <CardContent sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ bgcolor: alpha(color, 0.1), p: 1.5, borderRadius: 2, display: 'flex', color: color }}>
          {React.cloneElement(icon, { sx: { fontSize: 24 } })}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, mt: -0.5 }}>{value}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function SuperAdminDashboard() {
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Details Dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Status confirmation
  const [statusConfirm, setStatusConfirm] = useState({ open: false, id: null, status: '' });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summRes, compRes] = await Promise.all([
        SuperAdminApi.summary(),
        SuperAdminApi.companies()
      ]);
      setSummary(summRes.data);
      setCompanies(compRes.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toString().includes(search)
    );
  }, [companies, search]);

  const handleToggleStatus = async () => {
    if (!statusConfirm.id) return;
    try {
      await SuperAdminApi.setCompanyStatus(statusConfirm.id, statusConfirm.status === 'active' ? 'inactive' : 'active');
      setStatusConfirm({ open: false, id: null, status: '' });
      loadData();
    } catch (e) {
      console.error('Toggle status error:', e);
    }
  };

  const handleViewDetails = async (id) => {
    setDetailsLoading(true);
    setDetailsOpen(true);
    setDetailsTab(0);
    try {
      const res = await SuperAdminApi.company(id);
      setSelectedDetails(res.data);
    } catch (e) {
      console.error('Load details error:', e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownloadPayment = async (paymentId) => {
    if (!selectedDetails) return;
    try {
      const res = await SuperAdminApi.downloadPayment(selectedDetails.company.id, paymentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_INV_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', py: 2 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Admin Portal</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>System-wide overview and company management.</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />} 
            onClick={loadData}
            sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' }, fontWeight: 800 }}
          >
            {UI_ACTIONS.UPDATE}
          </Button>
        </Box>

        {loading ? <LinearProgress sx={{ borderRadius: 1 }} /> : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title={`Total ${LEGAL_TERMS.COMPANY}s`} value={summary?.totalCompanies || 0} icon={<CorporateFareIcon />} color={theme.palette.primary.main} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Active Users" value={summary?.totalUsers || 0} icon={<PeopleIcon />} color={theme.palette.success.main} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title={`Total ${LEGAL_TERMS.CASE}s`} value={summary?.totalCases || 0} icon={<GavelIcon />} color={theme.palette.warning.main} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title={`Active ${LEGAL_TERMS.COMPANY}s`} value={summary?.activeCompanies || 0} icon={<AssignmentIndIcon />} color={theme.palette.info.main} />
              </Grid>
            </Grid>

            {error && <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), border: '1px solid', borderColor: 'error.main' }}>
              <CardContent sx={{ color: 'error.main', py: 1.5, fontWeight: 700 }}>{error}</CardContent>
            </Card>}

            <Card sx={{ borderRadius: 2.5, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search firms by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, fontSize: '0.875rem' }
                  }}
                />
              </Box>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                      <TableCell sx={{ fontWeight: 800 }}>{LEGAL_TERMS.COMPANY} {COMMON_FIELDS.NAME}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Plan</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">Users</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">{LEGAL_TERMS.CASE}s</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{COMMON_FIELDS.STATUS}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCompanies.map((c) => (
                      <TableRow key={c.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.name}</Typography>
                          <Typography variant="caption" color="text.secondary">ID: #{c.id}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={c.subscriptionPlan || 'FREE'} 
                            size="small" 
                            sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', borderRadius: 1 }} 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700 }}>{c.advocatesCount || 0}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700 }}>{c.casesCount || 0}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.status}
                            color={c.status === 'active' ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View Detailed Profile">
                              <IconButton size="small" onClick={() => handleViewDetails(c.id)} color="primary">
                                <VisibilityIcon sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={c.status === 'active' ? 'Deactivate Firm' : 'Activate Firm'}>
                              <IconButton 
                                size="small"
                                onClick={() => setStatusConfirm({ open: true, id: c.id, status: c.status })}
                                color={c.status === 'active' ? 'error' : 'success'}
                              >
                                {c.status === 'active' ? <ToggleOnIcon sx={{ fontSize: 24 }} /> : <ToggleOffIcon sx={{ fontSize: 24 }} />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No legal firms found matching your search.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </>
        )}
      </Stack>

      {/* Firm Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minHeight: '60vh' } }}
      >
        {detailsLoading || !selectedDetails ? (
           <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><LinearProgress sx={{ width: '100%', borderRadius: 1 }} /></Box>
        ) : (
          <>
            <DialogTitle sx={{ p: 3, pb: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                  <CorporateFareIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>{selectedDetails.company.name}</Typography>
                  <Typography variant="caption" color="text.secondary">ID: #{selectedDetails.company.id} • Member since {new Date(selectedDetails.company.createdAt).toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Chip 
                  label={selectedDetails.company.status} 
                  color={selectedDetails.company.status === 'active' ? 'success' : 'default'} 
                  size="small" 
                  sx={{ fontWeight: 800, textTransform: 'uppercase' }} 
                />
              </Stack>
            </DialogTitle>

            <Box sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={detailsTab} onChange={(e, v) => setDetailsTab(v)} sx={{ minHeight: 48 }}>
                <Tab label="Profile" sx={{ fontWeight: 800, fontSize: '0.75rem' }} />
                <Tab label={`Team (${selectedDetails.stats.advocatesCount})`} sx={{ fontWeight: 800, fontSize: '0.75rem' }} />
                <Tab label={`Payments (${selectedDetails.payments.length})`} sx={{ fontWeight: 800, fontSize: '0.75rem' }} />
              </Tabs>
            </Box>

            <DialogContent sx={{ p: 3 }}>
              {detailsTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5 }}>{LEGAL_TERMS.COMPANY} Information</Typography>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Official {COMMON_FIELDS.EMAIL}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedDetails.company.email || 'Not provided'}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <LocalPhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Contact {COMMON_FIELDS.PHONE}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedDetails.company.phone || 'Not provided'}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{LEGAL_TERMS.COMPANY} {COMMON_FIELDS.ADDRESS}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedDetails.company.address || 'Not provided'}</Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5 }}>Subscription Status</Typography>
                    <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Current Plan</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>{selectedDetails.company.subscriptionPlan || 'Free'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Billing Status</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'success.main' }}>Paid</Typography>
                          </Box>
                          <Divider />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Total Cases</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>{selectedDetails.stats.casesCount}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Registered Clients</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>{selectedDetails.stats.clientsCount}</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {detailsTab === 1 && (
                <Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Member Name</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Joined</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedDetails.users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell sx={{ fontWeight: 700 }}>{u.name}</TableCell>
                          <TableCell>
                            <Chip label={u.role === 'admin' ? 'FIRM OWNER' : 'ADVOCATE'} size="small" sx={{ fontSize: '0.6rem', fontWeight: 800 }} />
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell variant="caption">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {detailsTab === 2 && (
                <Box>
                  {selectedDetails.payments.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <PaymentsIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3, mb: 1 }} />
                      <Typography color="text.secondary">No payment history found for this firm.</Typography>
                    </Box>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                          <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Plan</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>{COMMON_FIELDS.STATUS}</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">{UI_ACTIONS.DOWNLOAD}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedDetails.payments.map((p) => (
                          <TableRow key={p.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                            <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>{p.plan}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>₹{p.amount}</TableCell>
                            <TableCell>
                              <Chip label={p.status} color="success" size="small" sx={{ fontSize: '0.6rem', fontWeight: 900 }} />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="primary" onClick={() => handleDownloadPayment(p.id)}>
                                <DownloadIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              )}
            </DialogContent>
          </>
        )}
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setDetailsOpen(false)} sx={{ fontWeight: 800 }}>{UI_ACTIONS.CLOSE}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog 
        open={statusConfirm.open}
        onClose={() => setStatusConfirm({ open: false, id: null, status: '' })}
        onConfirm={handleToggleStatus}
        title={statusConfirm.status === 'active' ? 'Deactivate Firm?' : 'Activate Firm?'}
        message={`Are you sure you want to ${statusConfirm.status === 'active' ? 'suspend' : 'reinstate'} this firm's access to the platform?`}
        confirmText={statusConfirm.status === 'active' ? 'Deactivate' : 'Activate'}
        severity={statusConfirm.status === 'active' ? 'error' : 'info'}
      />
    </Box>
  );
}
