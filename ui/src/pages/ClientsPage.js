import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow, Avatar, IconButton, alpha, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';

import { ClientsApi } from '../services/api';
import { getRole } from '../auth';
import { isValidEmail, isValidPhoneOptional10Digit, required } from '../utils/validation';

export default function ClientsPage() {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', district: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  const role = getRole();
  const isAdmin = role === 'admin';

  const load = async () => {
    try {
      const res = await ClientsApi.list({ includeCases: 1 });
      setItems(res.data);
    } catch (err) {}
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())), [items, search]);

  const validate = () => {
    const next = {};
    if (!required(form.name)) next.name = 'Required';
    if (!isValidEmail(form.email)) next.email = 'Invalid';
    if (!required(form.address)) next.address = 'Required';
    if (!required(form.district)) next.district = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 1.5 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Clients</Typography>
            <Typography variant="caption" color="text.secondary">Manage your client base.</Typography>
          </Box>
          {isAdmin && <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ fontWeight: 800 }}>Add Client</Button>}
        </Box>

        {status.message && <Alert severity={status.type} size="small" sx={{p:0, borderRadius:1}}>{status.message}</Alert>}

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Box sx={{ p:1.5, borderBottom:'1px solid', borderColor:'divider' }}>
            <TextField fullWidth placeholder="Search clients..." size="small" value={search} onChange={e => setSearch(e.target.value)} InputProps={{ sx:{fontSize:'0.75rem'} }} />
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>District</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Cases</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', fontWeight: 900 }}>{c.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>ID: {c.id}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ display: 'block' }}>{c.email || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{c.phone || '-'}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="caption">{c.district}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontWeight: 900 }}>{(c.cases || []).length} cases</Typography></TableCell>
                  <TableCell align="right">
                    {isAdmin && <IconButton size="small" color="error" onClick={async () => {
                      if(window.confirm('Remove?')) { await ClientsApi.remove(c.id); load(); }
                    }}><DeleteOutlineIcon sx={{fontSize:16}}/></IconButton>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Add Client</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Stack spacing={2}>
            <TextField fullWidth label="Name" size="small" value={form.name} onChange={e => setForm({...form, name: e.target.value})} error={!!errors.name} />
            <TextField fullWidth label="Email" size="small" value={form.email} onChange={e => setForm({...form, email: e.target.value})} error={!!errors.email} />
            <TextField fullWidth label="Phone" size="small" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} error={!!errors.phone} />
            <TextField fullWidth label="District" size="small" value={form.district} onChange={e => setForm({...form, district: e.target.value})} error={!!errors.district} />
            <TextField fullWidth label="Address" size="small" multiline rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} error={!!errors.address} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={async () => { if(validate()) { await ClientsApi.create(form); setOpen(false); load(); } }}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
