import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Divider,
  Avatar,
  Tab,
  Tabs,
  Paper,
  InputAdornment
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import LaunchIcon from '@mui/icons-material/Launch';
import FilterListIcon from '@mui/icons-material/FilterList';

import { ReportsApi, CasesApi, AdvocatesApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ReportSectionHeader = ({ title, icon, color }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
      <Avatar sx={{ 
        bgcolor: alpha(color, 0.1), 
        color: color,
        width: 32,
        height: 32,
        fontSize: '1rem',
        borderRadius: 1.5
      }}>
        {icon}
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
        {title}
      </Typography>
    </Stack>
  );
};

export default function ReportsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState(0);
  const [byDistrict, setByDistrict] = useState([]);
  const [byAdvocate, setByAdvocate] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  
  const [range, setRange] = useState(() => {
    const d = new Date();
    const from = new Date(d);
    const to = new Date(d);
    to.setDate(to.getDate() + 30);
    return { 
      from: from.toISOString().split('T')[0], 
      to: to.toISOString().split('T')[0] 
    };
  });

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBaseData = async () => {
    try {
      const [dRes, aRes, advRes] = await Promise.all([
        ReportsApi.casesByDistrict(),
        ReportsApi.casesByAdvocate(),
        AdvocatesApi.list({})
      ]);
      setByDistrict(dRes.data);
      setByAdvocate(aRes.data);
      setAdvocates(advRes.data);
    } catch (err) {
      console.error('Failed to load base reports', err);
    }
  };

  const loadUpcoming = async () => {
    setLoading(true);
    try {
      const res = await ReportsApi.upcomingHearings(range);
      setUpcoming(res.data);
    } catch (err) {
      console.error('Failed to load upcoming hearings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
    loadUpcoming();
  }, []);

  const handleDownloadReport = async (caseId, caseNumber) => {
    try {
      const res = await CasesApi.downloadReport(caseId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Case_Report_${caseNumber || caseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Report download failed', e);
    }
  };

  // Helper to get advocate name from ID
  const getAdvocateName = (id) => {
    if (!id) return '(Unassigned)';
    const adv = advocates.find(a => a.id === id);
    return adv ? adv.name : `ID: ${id}`;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
            Reports & Statement
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate detailed district-wise, advocate-wise and hearing statements.
          </Typography>
        </Box>

        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Tabs 
            value={tab} 
            onChange={(e, v) => setTab(v)}
            sx={{ 
              px: 2, 
              bgcolor: 'action.hover',
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': { py: 2, fontWeight: 700, fontSize: '0.85rem' }
            }}
          >
            <Tab label="Hearings Statement" />
            <Tab label="District Wise" />
            <Tab label="Advocate Wise" />
          </Tabs>

          <Box sx={{ p: 4 }}>
            {/* TAB 0: UPCOMING HEARINGS */}
            {tab === 0 && (
              <Fade in={tab === 0}>
                <Box>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end" sx={{ mb: 4 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <ReportSectionHeader title="Hearing Statements" icon={<CalendarMonthIcon fontSize="small" />} color={theme.palette.primary.main} />
                    </Box>
                    <TextField
                      label="From Date"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={range.from}
                      onChange={(e) => setRange({ ...range, from: e.target.value })}
                    />
                    <TextField
                      label="To Date"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={range.to}
                      onChange={(e) => setRange({ ...range, to: e.target.value })}
                    />
                    <Button 
                      variant="contained" 
                      onClick={loadUpcoming} 
                      disabled={loading}
                      sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
                    >
                      Generate Statement
                    </Button>
                  </Stack>

                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 800, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' } }}>
                        <TableCell>Hearing Date</TableCell>
                        <TableCell>Case Title & Number</TableCell>
                        <TableCell>Court / District</TableCell>
                        <TableCell>Assigned Advocate</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcoming.map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{c.nextHearingDate}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{c.caseNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{c.courtName || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">{c.district}</Typography>
                          </TableCell>
                          <TableCell>{c.assignedAdvocate?.name || 'Unassigned'}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title="View Case">
                                <IconButton size="small" onClick={() => navigate(`/cases/${c.id}`)}>
                                  <LaunchIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Report">
                                <IconButton size="small" color="primary" onClick={() => handleDownloadReport(c.id, c.caseNumber)}>
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {upcoming.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">No records found for specified range.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Fade>
            )}

            {/* TAB 1: DISTRICT WISE */}
            {tab === 1 && (
              <Fade in={tab === 1}>
                <Box>
                  <ReportSectionHeader title="District Wise Case Summary" icon={<LocationOnIcon fontSize="small" />} color={theme.palette.secondary.main} />
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={5}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ '& th': { fontWeight: 800, color: 'text.secondary' } }}>
                            <TableCell>District</TableCell>
                            <TableCell align="right">Active Cases</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {byDistrict.map((r) => (
                            <TableRow key={r.district} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{r.district}</TableCell>
                              <TableCell align="right">{r.count}</TableCell>
                            </TableRow>
                          ))}
                          {byDistrict.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} align="center" sx={{ py: 4 }}>No data.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Grid>
                    <Grid item xs={12} md={7}>
                      <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: 'action.hover' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Quick Insights</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Use the "District Wise" summary to identify workload distribution across Kerala and neighboring states. 
                          You can generate full case reports for specific matters from the "Cases" page or the "Hearings Statement" tab.
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Fade>
            )}

            {/* TAB 2: ADVOCATE WISE */}
            {tab === 2 && (
              <Fade in={tab === 2}>
                <Box>
                  <ReportSectionHeader title="Advocate Caseload Statement" icon={<PersonIcon fontSize="small" />} color={theme.palette.success.main} />
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ '& th': { fontWeight: 800, color: 'text.secondary' } }}>
                            <TableCell>Advocate / Team Member</TableCell>
                            <TableCell align="right">Total Handled</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {byAdvocate.map((r) => (
                            <TableRow key={String(r.advocateId)} hover>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {getAdvocateName(r.advocateId)}
                              </TableCell>
                              <TableCell align="right">{r.count}</TableCell>
                            </TableRow>
                          ))}
                          {byAdvocate.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} align="center" sx={{ py: 4 }}>No data.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Grid>
                  </Grid>
                </Box>
              </Fade>
            )}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

const Fade = ({ children, in: isIn }) => {
  return (
    <Box sx={{ 
      transition: 'opacity 300ms ease-in-out', 
      opacity: isIn ? 1 : 0,
      display: isIn ? 'block' : 'none'
    }}>
      {children}
    </Box>
  );
};
