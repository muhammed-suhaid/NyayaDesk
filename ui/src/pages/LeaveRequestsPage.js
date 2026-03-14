import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Card, CardContent, Grid, Stack, TextField, Typography, Box, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, useTheme, alpha, Fade, Tooltip, Table, TableHead, TableBody, TableRow, TableCell, Avatar, LinearProgress
} from '@mui/material';
import { CheckCircle, Cancel, History, Pending, Description, PostAdd, Info } from '@mui/icons-material';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { getRole } from '../auth';
import { LeaveApi } from '../services/api';
import { UI_ACTIONS, LEGAL_TERMS, COMMON_FIELDS } from '../constants';

const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Personal', 'Other'];

const StatusChip = ({ status }) => {
  const theme = useTheme();
  const c = { pending: theme.palette.warning.main, approved: theme.palette.success.main, rejected: theme.palette.error.main }[status] || theme.palette.warning.main;
  return (
    <Chip size="small" label={status.toUpperCase()} sx={{ fontWeight: 800, borderRadius: 1, fontSize: '0.6rem', bgcolor: alpha(c, 0.1), color: c }} />
  );
};

export default function LeaveRequestsPage() {
  const theme = useTheme();
  const role = getRole();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '', leaveType: 'Casual' });
  const [errors, setErrors] = useState({});
  const [openSubmit, setOpenSubmit] = useState(false);
  const [filter, setFilter] = useState('all');

  // Confirmation state
  const [updateConfirm, setUpdateConfirm] = useState({ open: false, id: null, status: '' });

  const load = async () => {
    setLoading(true);
    try { const res = await LeaveApi.list({}); setItems(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async () => {
    if (!updateConfirm.id) return;
    try {
      await LeaveApi.update(updateConfirm.id, { status: updateConfirm.status });
      setUpdateConfirm({ open: false, id: null, status: '' });
      load();
    } catch {}
  };

  const calculateDays = (s, e) => {
    if (!s || !e) return 0;
    const diff = Math.ceil((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const filtered = items.filter(i => filter === 'all' || i.status === filter);
  const stats = { total: items.length, pending: items.filter(i => i.status === 'pending').length, approved: items.filter(i => i.status === 'approved').length };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 1.5 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>{LEGAL_TERMS.LEAVE}</Typography>
            <Typography variant="caption" color="text.secondary">Manage your time off.</Typography>
          </Box>
          {role === 'advocate' && <Button variant="contained" size="small" startIcon={<PostAdd />} onClick={() => setOpenSubmit(true)} sx={{ fontWeight: 800 }}>{UI_ACTIONS.APPLY}</Button>}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={4}><Card sx={{boxShadow:'none', border:'1px solid', borderColor:'divider', borderRadius:2}}><CardContent sx={{p:1.5}}><Typography variant="caption" sx={{fontWeight:700, display:'block', fontSize:'0.6rem', color:'text.secondary'}}>TOTAL</Typography><Typography variant="h6" sx={{fontWeight:900}}>{stats.total}</Typography></CardContent></Card></Grid>
          <Grid item xs={4}><Card sx={{boxShadow:'none', border:'1px solid', borderColor:'divider', borderRadius:2}}><CardContent sx={{p:1.5}}><Typography variant="caption" sx={{fontWeight:700, display:'block', fontSize:'0.6rem', color:'text.secondary'}}>PENDING</Typography><Typography variant="h6" sx={{fontWeight:900, color:theme.palette.warning.main}}>{stats.pending}</Typography></CardContent></Card></Grid>
          <Grid item xs={4}><Card sx={{boxShadow:'none', border:'1px solid', borderColor:'divider', borderRadius:2}}><CardContent sx={{p:1.5}}><Typography variant="caption" sx={{fontWeight:700, display:'block', fontSize:'0.6rem', color:'text.secondary'}}>APPROVED</Typography><Typography variant="h6" sx={{fontWeight:900, color:theme.palette.success.main}}>{stats.approved}</Typography></CardContent></Card></Grid>
        </Grid>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>History</Typography>
            <Stack direction="row" spacing={1}>
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <Button key={f} size="small" onClick={() => setFilter(f)} sx={{ fontWeight: 800, fontSize: '0.65rem', minWidth: 0, px: 1.5, borderRadius: 1.5, bgcolor: filter===f?'action.selected':'transparent' }}>{f.toUpperCase()}</Button>
              ))}
            </Stack>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            {loading && <LinearProgress />}
            <Table size="small">
              <TableHead><TableRow sx={{bgcolor:'action.hover'}}>{role==='admin'&&<TableCell sx={{fontWeight:800}}>{LEGAL_TERMS.TEAM} Member</TableCell>}<TableCell sx={{fontWeight:800}}>Dates</TableCell><TableCell align="center" sx={{fontWeight:800}}>Days</TableCell><TableCell sx={{fontWeight:800}}>{COMMON_FIELDS.TYPE}</TableCell><TableCell sx={{fontWeight:800}}>{COMMON_FIELDS.REASON}</TableCell><TableCell align="center" sx={{fontWeight:800}}>{COMMON_FIELDS.STATUS}</TableCell>{role==='admin'&&<TableCell />}</TableRow></TableHead>
              <TableBody>
                {filtered.map(i => (
                  <TableRow key={i.id} hover>
                    {role==='admin'&&<TableCell><Stack direction="row" spacing={1} alignItems="center"><Avatar sx={{width:22,height:22,fontSize:'0.6rem'}}>{i.advocateName?.charAt(0)}</Avatar><Typography variant="caption" sx={{fontWeight:800}}>{i.advocateName}</Typography></Stack></TableCell>}
                    <TableCell><Typography variant="caption" sx={{fontWeight:800}}>{i.startDate}</Typography><Typography variant="caption" sx={{display:'block', opacity:0.6, fontSize:'0.55rem'}}>to {i.endDate}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" sx={{fontWeight:900}}>{calculateDays(i.startDate, i.endDate)}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{i.leaveType}</Typography></TableCell>
                    <TableCell><Typography variant="caption" sx={{maxWidth:150, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{i.reason}</Typography></TableCell>
                    <TableCell align="center"><StatusChip status={i.status} /></TableCell>
                    {role==='admin'&&<TableCell align="right">
                      {i.status==='pending' && (
                        <Stack direction="row" spacing={1}>
                          <Button 
                            size="small" 
                            color="success" 
                            onClick={() => setUpdateConfirm({ open: true, id: i.id, status: 'approved' })} 
                            sx={{fontWeight:800, fontSize:'0.6rem'}}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={() => setUpdateConfirm({ open: true, id: i.id, status: 'rejected' })} 
                            sx={{fontWeight:800, fontSize:'0.6rem'}}
                          >
                            Reject
                          </Button>
                        </Stack>
                      )}
                    </TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </Stack>

      <Dialog open={openSubmit} onClose={() => setOpenSubmit(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{UI_ACTIONS.APPLY}</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}><TextField fullWidth type="date" label="From" InputLabelProps={{shrink:true}} value={form.fromDate} onChange={e=>setForm({...form, fromDate:e.target.value})} size="small"/><TextField fullWidth type="date" label="To" InputLabelProps={{shrink:true}} value={form.toDate} onChange={e=>setForm({...form, toDate:e.target.value})} size="small"/></Stack>
            <TextField select fullWidth label={COMMON_FIELDS.TYPE} value={form.leaveType} onChange={e=>setForm({...form, leaveType:e.target.value})} size="small">{LEAVE_TYPES.map(t=><MenuItem key={t} value={t} sx={{fontSize:'0.75rem'}}>{t}</MenuItem>)}</TextField>
            <TextField fullWidth multiline rows={2} label={COMMON_FIELDS.REASON} value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenSubmit(false)}>{UI_ACTIONS.CANCEL}</Button><Button variant="contained" onClick={async ()=>{ await LeaveApi.submit(form); setOpenSubmit(false); load(); }} sx={{fontWeight:900}}>{UI_ACTIONS.APPLY}</Button></DialogActions>
      </Dialog>

      <ConfirmationDialog 
        open={updateConfirm.open}
        onClose={() => setUpdateConfirm({ open: false, id: null, status: '' })}
        onConfirm={handleUpdate}
        title={updateConfirm.status === 'approved' ? 'Approve Leave?' : 'Reject Leave?'}
        message={`Are you sure you want to ${updateConfirm.status} this leave request?`}
        confirmText={updateConfirm.status === 'approved' ? 'Approve' : 'Reject'}
        severity={updateConfirm.status === 'approved' ? 'info' : 'error'}
      />
    </Box>
  );
}
