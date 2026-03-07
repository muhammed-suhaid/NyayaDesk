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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { AdvocatesApi, CasesApi, ClientsApi } from '../services/api';

const caseGroups = ['Civil', 'Criminal', 'Consumer', 'Family', 'Writ', 'Other'];
const statuses = ['Open', 'Pending', 'Closed'];

export default function CasesPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [clients, setClients] = useState([]);

  const [filters, setFilters] = useState({ status: '', advocateId: '', district: '' });

  const [openCreate, setOpenCreate] = useState(false);
  const [createStatus, setCreateStatus] = useState({ type: '', message: '' });
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
    nextPurpose: '',
    description: '',
    assignedAdvocateId: '',
    clientIds: [],
  });
  const [errors, setErrors] = useState({
    title: '',
    caseNumber: '',
    caseType: '',
    courtName: '',
    district: '',
    state: '',
    nextHearingDate: '',
    nextPurpose: '',
    description: '',
    clientIds: '',
  });

  const validateCreate = () => {
    const next = {
      title: '',
      caseNumber: '',
      caseType: '',
      courtName: '',
      district: '',
      state: '',
      nextHearingDate: '',
      nextPurpose: '',
      description: '',
      clientIds: '',
    };
    if (!form.title.trim()) next.title = 'Case title is required';
    if (!String(form.caseNumber || '').trim()) next.caseNumber = 'Case number is required';
    if (!String(form.caseType || '').trim()) next.caseType = 'Case type is required';
    if (!String(form.courtName || '').trim()) next.courtName = 'Court name is required';
    if (!String(form.district || '').trim()) next.district = 'District is required';
    if (!String(form.state || '').trim()) next.state = 'State is required';
    if (!String(form.nextPurpose || '').trim()) next.nextPurpose = 'Next purpose is required';
    if (!String(form.description || '').trim()) next.description = 'Description is required';
    if (!Array.isArray(form.clientIds) || form.clientIds.length === 0) next.clientIds = 'Select at least one client';
    if (form.nextHearingDate) {
      const d = new Date(form.nextHearingDate);
      if (Number.isNaN(d.getTime())) next.nextHearingDate = 'Invalid date';
    } else {
      next.nextHearingDate = 'Next hearing date is required';
    }
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const params = useMemo(() => {
    const p = {};
    if (filters.status) p.status = filters.status;
    if (filters.advocateId) p.advocateId = filters.advocateId;
    if (filters.district) p.district = filters.district;
    return p;
  }, [filters]);

  const load = async () => {
    const [casesRes, advRes, clRes] = await Promise.all([
      CasesApi.list(params),
      AdvocatesApi.list({}),
      ClientsApi.list({}),
    ]);
    setItems(casesRes.data);
    setAdvocates(advRes.data);
    setClients(clRes.data);
  };

  useEffect(() => {
    load();
  }, [params]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Cases</Typography>
        <Button variant="contained" onClick={() => setOpenCreate(true)}>
          Create Case
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  {statuses.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Advocate</InputLabel>
                <Select
                  label="Advocate"
                  value={filters.advocateId}
                  onChange={(e) => setFilters((s) => ({ ...s, advocateId: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  {advocates.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="District"
                value={filters.district}
                onChange={(e) => setFilters((s) => ({ ...s, district: e.target.value }))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Case No.</TableCell>
                <TableCell>District</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Next Hearing</TableCell>
                <TableCell>Advocate</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.caseNumber || '-'}</TableCell>
                  <TableCell>{c.district || '-'}</TableCell>
                  <TableCell>{c.currentStatus || '-'}</TableCell>
                  <TableCell>{c.nextHearingDate || '-'}</TableCell>
                  <TableCell>{c.assignedAdvocate?.name || '-'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate(`/cases/${c.id}`)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>No cases found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Case</DialogTitle>
        <DialogContent>
          {createStatus.message ? <Alert severity={createStatus.type} sx={{ mb: 2 }}>
            {createStatus.message}
          </Alert> : null}
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Case title"
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  error={Boolean(errors.title)}
                  helperText={errors.title}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Case number"
                  value={form.caseNumber}
                  onChange={(e) => setForm((s) => ({ ...s, caseNumber: e.target.value }))}
                  required
                  error={Boolean(errors.caseNumber)}
                  helperText={errors.caseNumber}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Case type"
                  value={form.caseType}
                  onChange={(e) => setForm((s) => ({ ...s, caseType: e.target.value }))}
                  required
                  error={Boolean(errors.caseType)}
                  helperText={errors.caseType}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Case group</InputLabel>
                  <Select
                    label="Case group"
                    value={form.caseGroup}
                    onChange={(e) => setForm((s) => ({ ...s, caseGroup: e.target.value }))}
                  >
                    {caseGroups.map((g) => (
                      <MenuItem key={g} value={g}>
                        {g}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Court name"
                  value={form.courtName}
                  onChange={(e) => setForm((s) => ({ ...s, courtName: e.target.value }))}
                  required
                  error={Boolean(errors.courtName)}
                  helperText={errors.courtName}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="District"
                  value={form.district}
                  onChange={(e) => setForm((s) => ({ ...s, district: e.target.value }))}
                  required
                  error={Boolean(errors.district)}
                  helperText={errors.district}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="State"
                  value={form.state}
                  onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
                  required
                  error={Boolean(errors.state)}
                  helperText={errors.state}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Next hearing date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.nextHearingDate}
                  onChange={(e) => setForm((s) => ({ ...s, nextHearingDate: e.target.value }))}
                  error={Boolean(errors.nextHearingDate)}
                  helperText={errors.nextHearingDate}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={form.currentStatus}
                    onChange={(e) => setForm((s) => ({ ...s, currentStatus: e.target.value }))}
                  >
                    {statuses.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Assigned advocate</InputLabel>
                  <Select
                    label="Assigned advocate"
                    value={form.assignedAdvocateId}
                    onChange={(e) => setForm((s) => ({ ...s, assignedAdvocateId: e.target.value }))}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {advocates.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Linked clients</InputLabel>
                  <Select
                    multiple
                    label="Linked clients"
                    value={form.clientIds}
                    onChange={(e) => setForm((s) => ({ ...s, clientIds: e.target.value }))}
                  >
                    {clients.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {errors.clientIds ? (
                  <Typography variant="caption" color="error">
                    {errors.clientIds}
                  </Typography>
                ) : null}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Next purpose of hearing"
                  value={form.nextPurpose}
                  onChange={(e) => setForm((s) => ({ ...s, nextPurpose: e.target.value }))}
                  required
                  error={Boolean(errors.nextPurpose)}
                  helperText={errors.nextPurpose}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  required
                  error={Boolean(errors.description)}
                  helperText={errors.description}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              setCreateStatus({ type: '', message: '' });
              if (!validateCreate()) return;

              const assigned = form.assignedAdvocateId === '' ? null : Number(form.assignedAdvocateId);
              if (assigned !== null && Number.isNaN(assigned)) {
                setCreateStatus({ type: 'error', message: 'Invalid assigned advocate' });
                return;
              }

              try {
                await CasesApi.create({
                  ...form,
                  title: form.title.trim(),
                  district: form.district.trim() || null,
                  courtName: form.courtName.trim() || null,
                  state: form.state.trim() || null,
                  assignedAdvocateId: assigned,
                });
                setOpenCreate(false);
                setForm({
                  title: '',
                  caseNumber: '',
                  caseType: '',
                  caseGroup: 'Civil',
                  courtName: '',
                  district: '',
                  state: 'Kerala',
                  nextHearingDate: '',
                  currentStatus: 'Open',
                  nextPurpose: '',
                  description: '',
                  assignedAdvocateId: '',
                  clientIds: [],
                });
                setErrors({
                  title: '',
                  caseNumber: '',
                  caseType: '',
                  courtName: '',
                  district: '',
                  state: '',
                  nextHearingDate: '',
                  nextPurpose: '',
                  description: '',
                  clientIds: '',
                });
                load();
              } catch (e) {
                setCreateStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to create case' });
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
