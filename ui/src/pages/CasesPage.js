import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Chip,
  alpha,
  useTheme,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LaunchIcon from '@mui/icons-material/Launch';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import GavelIcon from '@mui/icons-material/Gavel';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

import { AdvocatesApi, CasesApi, ClientsApi } from '../services/api';
import { getRole } from '../auth';

const CASE_GROUPS = ['Civil', 'Criminal', 'Consumer', 'Family', 'Writ', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Disposed', 'Closed'];

const StatusBadge = ({ status }) => {
  const theme = useTheme();
  let color = theme.palette.info;
  if (status === 'Closed' || status === 'Disposed') color = theme.palette.success;
  if (status === 'Open') color = theme.palette.warning;

  return (
    <Chip 
      label={status} 
      size="small" 
      sx={{ 
        fontWeight: 800, 
        borderRadius: 1,
        height: 18,
        fontSize: '0.6rem',
        bgcolor: alpha(color.main, 0.1),
        color: color.main,
      }} 
    />
  );
};

const StatSummary = ({ title, value, icon, color }) => (
  <Card sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <CardContent sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ bgcolor: alpha(color, 0.1), p: 1, borderRadius: 1.5, display: 'flex', color: color, '& svg': { fontSize: 18 } }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.55rem', textTransform: 'uppercase' }}>{title}</Typography>
          <Typography variant="body1" sx={{ fontWeight: 900, lineHeight: 1 }}>{value}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function CasesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', advocateId: '', caseGroup: '', district: '', caseType: '', courtName: '', clientId: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    caseNumber: '', 
    caseType: '', 
    caseGroup: 'Civil', 
    courtName: '', 
    district: '', 
    state: 'Kerala', 
    nextHearingDate: '', 
    currentStatus: 'Open', 
    clientIds: [],
    assignedAdvocateId: '',
    nextPurpose: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const role = getRole();
  const canAdd = role === 'admin' || role === 'advocate';

  const load = async () => {
    try {
      const p = { ...filters, search };
      Object.keys(p).forEach(k => !p[k] && delete p[k]);
      const [cRes, aRes, clRes] = await Promise.all([CasesApi.list({ ...p, includeClients: true }), AdvocatesApi.list({}), ClientsApi.list({})]);
      setItems(cRes.data);
      setAdvocates(aRes.data);
      setClients(clRes.data);
    } catch (err) {}
  };

  useEffect(() => { load(); }, [filters, search]);

  const filtered = items; // Backend now handles all filtering

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(i => !['Closed', 'Disposed'].includes(i.currentStatus)).length,
    upcoming: items.filter(i => i.nextHearingDate).length,
  }), [items]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 1.5 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Cases</Typography>
            <Typography variant="caption" color="text.secondary">Manage and track all firm cases.</Typography>
          </Box>
          {canAdd && <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)} sx={{ fontWeight: 800 }}>Add Case</Button>}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={4}><StatSummary title="Total" value={stats.total} icon={<BusinessCenterIcon />} color={theme.palette.primary.main} /></Grid>
          <Grid item xs={4}><StatSummary title="Active" value={stats.active} icon={<GavelIcon />} color={theme.palette.warning.main} /></Grid>
          <Grid item xs={4}><StatSummary title="Upcoming" value={stats.upcoming} icon={<HistoryEduIcon />} color={theme.palette.info.main} /></Grid>
        </Grid>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
           <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField fullWidth placeholder="Search title, number, folder..." size="small" value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.disabled', mr: 0.5, fontSize: 16 }} />, sx: { fontSize: '0.75rem' } }} />
              </Grid>
              <Grid item xs={4} md={2.5}>
                <FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={e => setFilters({...filters, status: e.target.value})} sx={{ fontSize: '0.75rem' }}>
                    <MenuItem value="">All Status</MenuItem>
                    {STATUSES.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.75rem' }}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4} md={2.5}>
                <FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Group</InputLabel>
                  <Select value={filters.caseGroup} label="Group" onChange={e => setFilters({...filters, caseGroup: e.target.value})} sx={{ fontSize: '0.75rem' }}>
                    <MenuItem value="">All Groups</MenuItem>
                    {CASE_GROUPS.map(g => <MenuItem key={g} value={g} sx={{ fontSize: '0.75rem' }}>{g}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4} md={3} sx={{ display:'flex', gap:0.5 }}>
                <Button 
                  size="small" 
                  onClick={() => setShowAdvanced(!showAdvanced)} 
                  variant={showAdvanced ? 'contained' : 'outlined'}
                  startIcon={<FilterListIcon sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                >
                  {showAdvanced ? 'Less' : 'More'}
                </Button>
                <IconButton size="small" onClick={() => { setSearch(''); setFilters({ status: '', advocateId: '', caseGroup: '', district: '', caseType: '', courtName: '', clientId: '' }); }}><FilterListIcon sx={{ fontSize: 16 }} /></IconButton>
              </Grid>
            </Grid>

            {showAdvanced && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Advocate</InputLabel>
                      <Select value={filters.advocateId} label="Advocate" onChange={e => setFilters({...filters, advocateId: e.target.value})} sx={{ fontSize: '0.75rem' }}>
                        <MenuItem value="">All Members</MenuItem>
                        {advocates.map(a => <MenuItem key={a.id} value={a.id} sx={{ fontSize: '0.75rem' }}>{a.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Client</InputLabel>
                      <Select value={filters.clientId} label="Client" onChange={e => setFilters({...filters, clientId: e.target.value})} sx={{ fontSize: '0.75rem' }}>
                        <MenuItem value="">All Clients</MenuItem>
                        {clients.map(cl => <MenuItem key={cl.id} value={cl.id} sx={{ fontSize: '0.75rem' }}>{cl.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth placeholder="District" size="small" value={filters.district} onChange={e => setFilters({...filters, district: e.target.value})} InputProps={{ sx: { fontSize: '0.75rem' } }} />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth placeholder="Case Type" size="small" value={filters.caseType} onChange={e => setFilters({...filters, caseType: e.target.value})} InputProps={{ sx: { fontSize: '0.75rem' } }} />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth placeholder="Court Name" size="small" value={filters.courtName} onChange={e => setFilters({...filters, courtName: e.target.value})} InputProps={{ sx: { fontSize: '0.75rem' } }} />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Case</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Clients</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Court</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Advocate</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Next Hearing</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 900, display: 'block' }}>{c.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{c.caseNumber || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    {c.clients?.length > 0 ? (
                      c.clients.map((cl, i) => (
                        <Box key={cl.id} sx={{ mb: i === c.clients.length - 1 ? 0 : 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{cl.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{cl.phone || 'No phone'}</Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.disabled">None</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{c.courtName || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{c.district || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{c.assignedAdvocate?.name || 'None'}</Typography>
                  </TableCell>
                  <TableCell><StatusBadge status={c.currentStatus} /></TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>{c.nextHearingDate || '-'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(`/cases/${c.id}`)} sx={{ bgcolor: 'action.hover' }}><LaunchIcon sx={{ fontSize: 14 }} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Stack>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Add Case</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Case Title" 
                size="small" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                error={!!errors.title} 
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Case Number" 
                size="small" 
                value={form.caseNumber} 
                onChange={e => setForm({...form, caseNumber: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Case Type" 
                size="small" 
                placeholder="e.g. OS, OP, CC"
                value={form.caseType} 
                onChange={e => setForm({...form, caseType: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Case Group</InputLabel>
                <Select 
                  label="Case Group" 
                  value={form.caseGroup} 
                  onChange={e => setForm({...form, caseGroup: e.target.value})}
                >
                  {CASE_GROUPS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Court Name" 
                size="small" 
                value={form.courtName} 
                onChange={e => setForm({...form, courtName: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="District" 
                size="small" 
                value={form.district} 
                onChange={e => setForm({...form, district: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned Advocate</InputLabel>
                <Select 
                  label="Assigned Advocate" 
                  value={form.assignedAdvocateId} 
                  onChange={e => setForm({...form, assignedAdvocateId: e.target.value})}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {advocates.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Clients</InputLabel>
                <Select 
                  multiple 
                  label="Clients" 
                  value={form.clientIds} 
                  onChange={e => setForm({...form, clientIds: e.target.value})}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={clients.find(c => c.id === value)?.name} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {clients.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Next Hearing" 
                type="date" 
                InputLabelProps={{ shrink: true }} 
                size="small" 
                value={form.nextHearingDate} 
                onChange={e => setForm({...form, nextHearingDate: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Next Purpose" 
                size="small" 
                value={form.nextPurpose} 
                onChange={e => setForm({...form, nextPurpose: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Description" 
                size="small" 
                multiline 
                rows={3}
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
             if (!form.title) return setErrors({title:true});
             await CasesApi.create(form);
             setOpenCreate(false);
             load();
          }} sx={{ fontWeight: 900 }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
