import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow, Avatar, IconButton, Chip, alpha, useTheme, MenuItem, Select, FormControl, InputLabel, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';

import { AdvocatesApi, AdminApi } from '../services/api';
import { getRole } from '../auth';
import EditIcon from '@mui/icons-material/Edit';
import { isValidEmail, isValidPhoneRequired10Digit, passwordMinLen, required } from '../utils/validation';

export default function AdvocatesPage() {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', barCouncilNumber: '', role: 'Advocate', status: 'active' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  const role = getRole();
  const isAdmin = role === 'admin';

  const load = async () => {
    try {
      const res = await AdvocatesApi.list({ includeWorkload: 1 });
      setItems(res.data);
    } catch (err) {}
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())), [items, search]);

  const validate = () => {
    const next = {};
    if (!required(form.name)) next.name = 'Required';
    if (!isValidEmail(form.email)) next.email = 'Invalid';
    if (!isValidPhoneRequired10Digit(form.phone)) next.phone = 'Invalid';
    if (!editId && !passwordMinLen(form.password, 6)) next.password = 'Min 6 chars';
    if (form.role?.toLowerCase() === 'advocate' && !required(form.barCouncilNumber)) next.barCouncilNumber = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditId(item.userId || item.id);
      setForm({ ...item, password: '', status: item.status?.toLowerCase() || 'active' });
    } else {
      setEditId(null);
      setForm({ name: '', phone: '', email: '', password: '', barCouncilNumber: '', role: 'Advocate', status: 'active' });
    }
    setErrors({});
    setOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 1.5 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Team</Typography>
            <Typography variant="caption" color="text.secondary">Manage staff and credentials.</Typography>
          </Box>
          {isAdmin && <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ fontWeight: 800 }}>Add Staff</Button>}
        </Box>

        {status.message && <Alert severity={status.type} size="small" sx={{p:0, borderRadius:1}}>{status.message}</Alert>}

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Box sx={{ p:1.5, borderBottom:'1px solid', borderColor:'divider' }}>
            <TextField fullWidth placeholder="Search team..." size="small" value={search} onChange={e => setSearch(e.target.value)} InputProps={{ sx:{fontSize:'0.75rem'} }} />
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>BCN</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Workload</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', fontWeight: 900 }}>{a.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{a.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{a.role}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ display: 'block' }}>{a.email}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{a.phone}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="caption">{a.barCouncilNumber}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontWeight: 800 }}>{a.openCaseCount || 0} cases</Typography></TableCell>
                  <TableCell align="right">
                    {isAdmin && (
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton size="small" color="primary" onClick={() => handleOpen(a)}><EditIcon sx={{fontSize:16}}/></IconButton>
                        <IconButton size="small" color="error" onClick={async () => {
                          if(window.confirm('Remove staff access?')) { await AdvocatesApi.remove(a.id); load(); }
                        }}><DeleteOutlineIcon sx={{fontSize:16}}/></IconButton>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{editId ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Stack spacing={2}>
            <TextField fullWidth label="Name" size="small" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} error={!!errors.name} />
            <TextField fullWidth label="Email" size="small" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} error={!!errors.email} />
            <TextField fullWidth label="Phone" size="small" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} error={!!errors.phone} />
            <TextField 
              fullWidth 
              label={editId ? "New Password (optional)" : "Password"} 
              size="small" 
              type="password" 
              value={form.password || ''} 
              onChange={e => setForm({...form, password: e.target.value})} 
              error={!!errors.password} 
              placeholder={editId ? "Leave blank to keep current" : ""}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select value={form.role} label="Role" onChange={e => setForm({...form, role: e.target.value})}>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Advocate">Advocate</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} label="Status" onChange={e => setForm({...form, status: e.target.value})}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField 
              fullWidth 
              label="Bar Council Number" 
              size="small" 
              value={form.barCouncilNumber || ''} 
              onChange={e => setForm(prev => ({...prev, barCouncilNumber: e.target.value}))} 
              error={!!errors.barCouncilNumber} 
              helperText={errors.barCouncilNumber}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { 
            if(validate()) { 
              if (editId) {
                await AdminApi.updateUser(editId, form);
              } else {
                await AdvocatesApi.create(form);
              }
              setOpen(false); 
              load(); 
            } 
          }} sx={{ fontWeight: 900 }}>{editId ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
