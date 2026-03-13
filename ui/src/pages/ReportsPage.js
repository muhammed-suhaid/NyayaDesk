import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
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
  alpha,
  useTheme,
  Avatar,
  Tab,
  Tabs,
  Fade,
  LinearProgress,
  Chip
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LaunchIcon from '@mui/icons-material/Launch';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { ReportsApi, CasesApi, AdvocatesApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ReportsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [byDistrict, setByDistrict] = useState([]);
  const [byAdvocate, setByAdvocate] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [range, setRange] = useState({ 
    from: new Date().toISOString().split('T')[0], 
    to: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] 
  });
  const [loading, setLoading] = useState(false);

  const loadBase = async () => {
    try {
      const [dRes, aRes, advRes] = await Promise.all([ReportsApi.casesByDistrict(), ReportsApi.casesByAdvocate(), AdvocatesApi.list({})]);
      setByDistrict(dRes.data);
      setByAdvocate(aRes.data);
      setAdvocates(advRes.data);
    } catch (err) {}
  };

  const loadHearings = async () => {
    setLoading(true);
    try {
      const res = await ReportsApi.upcomingHearings(range);
      setUpcoming(res.data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadBase(); loadHearings(); }, []);

  const download = async (caseId, num) => {
    const res = await CasesApi.downloadReport(caseId);
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${num}.pdf`;
    a.click();
  };

  const getAdvName = (id) => advocates.find(a => a.id === id)?.name || 'Unassigned';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 1.5 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Reports</Typography>
          <Typography variant="caption" color="text.secondary">Detailed metrics and case reports.</Typography>
        </Box>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Tabs 
            value={tab} onChange={(e,v) => setTab(v)}
            sx={{ 
              px: 1, borderBottom: '1px solid', borderColor: 'divider', minHeight: 40,
              '& .MuiTab-root': { py: 1, minHeight: 40, fontWeight: 800, fontSize: '0.7rem' }
            }}
          >
            <Tab label="Hearings" />
            <Tab label="Districts" />
            <Tab label="Advocates" />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {tab === 0 && (
              <Fade in>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <TextField label="From" type="date" size="small" InputLabelProps={{shrink:true}} value={range.from} onChange={e=>setRange({...range, from:e.target.value})} sx={{'& .MuiInputBase-root':{fontSize:'0.7rem'}}} />
                    <TextField label="To" type="date" size="small" InputLabelProps={{shrink:true}} value={range.to} onChange={e=>setRange({...range, to:e.target.value})} sx={{'& .MuiInputBase-root':{fontSize:'0.7rem'}}} />
                    <Button variant="contained" size="small" onClick={loadHearings} disabled={loading}>Refresh</Button>
                  </Stack>
                  {loading && <LinearProgress sx={{ mb: 2, height: 2 }} />}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Case</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Court</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Advocate</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcoming.map(c => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.75rem' }}>{c.nextHearingDate}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{c.title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{c.caseNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{c.courtName || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{c.district}</Typography>
                          </TableCell>
                          <TableCell><Typography variant="caption" sx={{ fontWeight: 700 }}>{c.assignedAdvocate?.name || 'Unassigned'}</Typography></TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => download(c.id, c.caseNumber)} sx={{ color: 'error.main' }}><PictureAsPdfIcon sx={{ fontSize: 14 }} /></IconButton>
                            <IconButton size="small" onClick={() => navigate(`/cases/${c.id}`)} sx={{ color: 'primary.main' }}><LaunchIcon sx={{ fontSize: 14 }} /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Fade>
            )}

            {tab === 1 && (
              <Fade in>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Table size="small">
                      <TableHead><TableRow><TableCell sx={{fontWeight:800}}>District</TableCell><TableCell align="right" sx={{fontWeight:800}}>Cases</TableCell></TableRow></TableHead>
                      <TableBody>
                        {byDistrict.map(r => (
                          <TableRow key={r.district} hover>
                            <TableCell sx={{fontWeight:700, fontSize:'0.75rem'}}>{r.district}</TableCell>
                            <TableCell align="right"><Chip label={r.count} size="small" sx={{fontWeight:900, height:16, fontSize:'0.6rem'}}/></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>
              </Fade>
            )}

            {tab === 2 && (
              <Fade in>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Table size="small">
                      <TableHead><TableRow><TableCell sx={{fontWeight:800}}>Advocate</TableCell><TableCell align="right" sx={{fontWeight:800}}>Cases</TableCell></TableRow></TableHead>
                      <TableBody>
                        {byAdvocate.map(r => (
                          <TableRow key={r.advocateId} hover>
                            <TableCell sx={{fontWeight:700, fontSize:'0.75rem'}}>{getAdvName(r.advocateId)}</TableCell>
                            <TableCell align="right"><Typography variant="caption" sx={{fontWeight:900}}>{r.count}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>
              </Fade>
            )}
          </Box>
        </Card>
      </Stack>
    </Box>
  );
}
