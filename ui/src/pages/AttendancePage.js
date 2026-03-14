import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Card, CardContent, Grid, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, Select, MenuItem, FormControl, InputLabel, Box, IconButton, Tooltip, alpha, useTheme, Avatar, LinearProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

import { AttendanceApi, AdvocatesApi } from '../services/api';
import { getRole } from '../auth';
import { UI_ACTIONS, LEGAL_TERMS, COMMON_FIELDS, DASHBOARD_METRICS } from '../constants';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <CardContent sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ bgcolor: alpha(color, 0.1), p: 1, borderRadius: 1.5, display: 'flex', color: color }}>
          {React.cloneElement(icon, { sx: { fontSize: 18 } })}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase' }}>{title}</Typography>
          <Typography variant="body1" sx={{ fontWeight: 900, lineHeight: 1 }}>{value}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function AttendancePage() {
  const theme = useTheme();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [advocates, setAdvocates] = useState([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const role = getRole();
  const isAdmin = role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const p = { month: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}` };
      if (isAdmin && selectedAdvocate) p.advocateId = selectedAdvocate;
      const [attRes, advRes] = await Promise.all([
        AttendanceApi.list(p),
        isAdmin ? AdvocatesApi.list({}) : Promise.resolve({ data: [] })
      ]);
      setRecords(attRes.data);
      if (isAdmin) setAdvocates(advRes.data);
      const today = new Date().toISOString().split('T')[0];
      setTodayRecord(attRes.data.find(r => r.day === today || r.date === today) || null);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentMonth, selectedAdvocate]);

  const handleMark = async (p) => {
    try { await AttendanceApi.mark(p); load(); } catch (e) {}
  };

  const stats = useMemo(() => ({
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    total: records.length
  }), [records]);

  const days = Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 1.5 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>{LEGAL_TERMS.ATTENDANCE}</Typography>
            <Typography variant="caption" color="text.secondary">Track and manage staff activity.</Typography>
          </Box>
          {isAdmin && <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={async () => {
            const res = await AttendanceApi.export({ month: `${currentMonth.getFullYear()}-${currentMonth.getMonth()+1}`, advocateId: selectedAdvocate });
            const url = window.URL.createObjectURL(res.data);
            const a = document.createElement('a'); a.href = url; a.download = 'Attendance.xlsx'; a.click();
          }} sx={{ fontWeight: 800 }}>{UI_ACTIONS.DOWNLOAD}</Button>}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
              <Grid item xs={4}><StatCard title="Present" value={stats.present} icon={<CheckCircleOutlineIcon />} color={theme.palette.success.main} /></Grid>
              <Grid item xs={4}><StatCard title="Absent" value={stats.absent} icon={<CancelOutlinedIcon />} color={theme.palette.error.main} /></Grid>
              <Grid item xs={4}><StatCard title="Total" value={stats.total} icon={<EventAvailableIcon />} color={theme.palette.primary.main} /></Grid>
            </Grid>
          </Grid>
          {role === 'advocate' && (
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center' }}>
                <CardContent sx={{ p: 1.5, width: '100%' }}>
                  <Stack direction="row" spacing={1}>
                    <Button fullWidth size="small" variant={todayRecord?.checkInTime ? "outlined" : "contained"} color="success" startIcon={<LoginIcon sx={{fontSize:16}}/>} onClick={() => handleMark({status:'present', checkInTime: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})})} disabled={!!todayRecord?.checkInTime}>
                      {todayRecord?.checkInTime ? `In: ${todayRecord.checkInTime}` : 'In'}
                    </Button>
                    <Button fullWidth size="small" variant={todayRecord?.checkOutTime ? "outlined" : "contained"} color="primary" startIcon={<LogoutIcon sx={{fontSize:16}}/>} onClick={() => handleMark({status:'present', checkOutTime: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})})} disabled={!todayRecord?.checkInTime || !!todayRecord?.checkOutTime}>
                      {todayRecord?.checkOutTime ? `Out: ${todayRecord.checkOutTime}` : 'Out'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}><ChevronLeftIcon sx={{fontSize:16}}/></IconButton>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Typography>
              <IconButton size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}><ChevronRightIcon sx={{fontSize:16}}/></IconButton>
            </Stack>
            {isAdmin && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{fontSize:'0.7rem'}}>{LEGAL_TERMS.TEAM} Member</InputLabel>
                <Select value={selectedAdvocate} label={`${LEGAL_TERMS.TEAM} Member`} onChange={e => setSelectedAdvocate(e.target.value)} sx={{fontSize:'0.7rem'}}>
                  <MenuItem value="">Everyone</MenuItem>
                  {advocates.map(a => <MenuItem key={a.id} value={a.id} sx={{fontSize:'0.7rem'}}>{a.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 900, fontSize: '0.6rem', position: 'sticky', left:0, bgcolor: 'action.hover', zIndex: 5 }}>{LEGAL_TERMS.TEAM}</TableCell>
                  {days.map(d => <TableCell key={d} align="center" sx={{ fontWeight: 900, fontSize: '0.6rem', minWidth: 24 }}>{d}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={32}><LinearProgress sx={{height:1}}/></TableCell></TableRow>}
                {(isAdmin ? (selectedAdvocate ? advocates.filter(a=>a.id==selectedAdvocate) : advocates) : [{id:'me', name:'My Activity'}]).map(adv => (
                  <TableRow key={adv.id} hover>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 4, fontWeight: 800, fontSize: '0.7rem' }}>{adv.name}</TableCell>
                    {days.map(d => {
                       const date = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                       const r = records.find(x => x.day === date || x.date === date);
                       return (
                         <TableCell key={d} align="center" sx={{ p: 0.5, borderLeft: '1px solid', borderColor: 'divider' }}>
                           {r?.status === 'present' ? <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 14 }} /> : r?.status === 'absent' ? <CancelOutlinedIcon sx={{ color: 'error.main', fontSize: 14 }} /> : <Box sx={{ width: 4, height: 4, bgcolor: 'divider', borderRadius: '50%', mx:'auto' }} />}
                         </TableCell>
                       );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </Stack>
    </Box>
  );
}
