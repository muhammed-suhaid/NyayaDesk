import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, TextField,
  Typography, Table, TableBody, TableCell, TableHead, TableRow, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl,
  IconButton, Tooltip, alpha, useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DownloadIcon from '@mui/icons-material/Download';
import LockIcon from '@mui/icons-material/Lock';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { useNavigate, useParams } from 'react-router-dom';
import { CasesApi, AdvocatesApi, ClientsApi } from '../services/api';
import { getRole } from '../auth';
import { UI_ACTIONS, LEGAL_TERMS, CASE_CATEGORIES } from '../constants';

const STATUS_COLORS = {
  'Open': 'info',
  'In Progress': 'warning',
  'Disposed': 'success',
  'Closed': 'default'
};

const TimelineItem = ({ date, title, subtitle, isLast, color = 'primary.main', dotSize = 6 }) => (
  <Box sx={{ display: 'flex', position: 'relative', pb: isLast ? 0 : 2 }}>
    {!isLast && (
      <Box sx={{ position: 'absolute', top: 18, bottom: -6, left: '7px', borderLeft: '1.5px dashed', borderColor: 'divider' }} />
    )}
    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0, mt: 0.3 }}>
      <Box sx={{ width: dotSize, height: dotSize, borderRadius: '50%', bgcolor: color }} />
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem', display: 'block' }}>{date}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block' }}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2, whiteSpace: 'pre-wrap', display: 'block', fontSize: '0.7rem' }}>{subtitle}</Typography>}
    </Box>
  </Box>
);

export default function CaseDetailsPage() {
  const { caseId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isAdvocate = role === 'advocate';
  const canEdit = isAdmin || isAdvocate;

  const [caseData, setCaseData] = useState(null);
  const [advocates, setAdvocates] = useState([]);
  const [clients, setClients] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [editOpen, setEditOpen] = useState(false);
  const [hearingOpen, setHearingOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [disposeOpen, setDisposeOpen] = useState(false);

  const [caseForm, setCaseForm] = useState({});
  const [hearingForm, setHearingForm] = useState({});
  const [updateForm, setUpdateForm] = useState({});
  const [disposeForm, setDisposeForm] = useState({ status: 'Disposed', disposalDate: '', disposalReason: '', outcome: '' });
  
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('Evidence');
  const [uploading, setUploading] = useState(false);

  const id = Number(caseId);

  const showMsg = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const load = async () => {
    try {
      const [cRes, aRes, clRes] = await Promise.all([
        CasesApi.get(id),
        canEdit ? AdvocatesApi.list({}) : Promise.resolve({ data: [] }),
        canEdit ? ClientsApi.list({}) : Promise.resolve({ data: [] })
      ]);
      setCaseData(cRes.data);
      if (canEdit) {
        setAdvocates(aRes.data);
        setClients(clRes.data);
      }
    } catch (err) {
      showMsg('Load failed', 'error');
    }
  };

  useEffect(() => { load(); }, [id]);

  const nextH = useMemo(() => {
    if (!caseData?.hearings?.length) return null;
    const now = new Date().setHours(0,0,0,0);
    return caseData.hearings.filter(h => new Date(h.hearingDate) >= now).sort((a,b) => new Date(a.hearingDate) - new Date(b.hearingDate))[0];
  }, [caseData]);

  if (!caseData) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="body2">Loading...</Typography></Box>;

  const locked = ['Disposed', 'Closed'].includes(caseData.currentStatus);

  const handleUpdate = async () => {
    try {
      await CasesApi.update(id, caseForm);
      showMsg('Saved');
      setEditOpen(false);
      load();
    } catch (e) { showMsg(e?.response?.data?.error || 'Error', 'error'); }
  };

  const handleHearing = async () => {
    try {
      await CasesApi.addHearing(id, hearingForm);
      showMsg('Hearing added');
      setHearingOpen(false);
      load();
    } catch (e) { showMsg('Error', 'error'); }
  };

  const handleAddNote = async () => {
    try {
      await CasesApi.addUpdate(id, updateForm);
      showMsg('Note added');
      setUpdateOpen(false);
      load();
    } catch (e) { showMsg('Error', 'error'); }
  };

  const handleFinalize = async () => {
    try {
      await CasesApi.disposeCase(id, disposeForm);
      showMsg('Case closed');
      setDisposeOpen(false);
      load();
    } catch (e) { showMsg(e?.response?.data?.error || 'Error', 'error'); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await CasesApi.uploadDocument(id, file, docType);
      setFile(null);
      showMsg('Uploaded');
      load();
    } catch (e) { showMsg('Error', 'error'); }
    finally { setUploading(false); }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await CasesApi.downloadDocument(id, doc.id);
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFilename;
      a.click();
    } catch (e) { showMsg('Error', 'error'); }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete?')) return;
    try {
      await CasesApi.deleteDocument(id, docId);
      showMsg('Deleted');
      load();
    } catch (e) { showMsg('Error', 'error'); }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1.5, md: 3 } }}>
      <Stack spacing={2}>
        {locked && (
          <Alert severity="info" size="small" icon={<LockIcon fontSize="small" />} sx={{ borderRadius: 1, py: 0, fontWeight: 700, fontSize: '0.75rem' }}>
            Case is closed and cannot be modified.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>{caseData.title}</Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={async () => {
                      const res = await CasesApi.downloadReport(id);
                      const url = window.URL.createObjectURL(res.data);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Report_${caseData.caseNumber}.pdf`;
                      a.click();
                    }}><PictureAsPdfIcon sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton size="small" color="success" onClick={() => {
                      const client = caseData.clients?.[0];
                      if (!client?.phone) return showMsg('No phone', 'warning');
                      const msg = `Case: ${caseData.title}\nStatus: ${caseData.currentStatus}`;
                      window.open(`https://wa.me/91${client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}><WhatsAppIcon sx={{ fontSize: 18 }} /></IconButton>
                    {!locked && canEdit && (
                      <Button size="small" variant="outlined" onClick={() => { 
                        setCaseForm({
                          ...caseData,
                          clientIds: caseData.clients?.map(c => c.id) || []
                        }); 
                        setEditOpen(true); 
                      }} sx={{ fontWeight: 800 }}>{UI_ACTIONS.EDIT}</Button>
                    )}
                  </Stack>
                </Stack>
                
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip label={caseData.currentStatus} size="small" sx={{ fontWeight: 900, borderRadius: 1, height: 18, fontSize: '0.6rem' }} color={STATUS_COLORS[caseData.currentStatus] || 'primary'} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>#{caseData.caseNumber}</Typography>
                </Stack>

                <Grid container spacing={2}>
                  {[
                    { label: LEGAL_TERMS.COURT, value: caseData.courtName || '-' },
                    { label: 'Advocate', value: caseData.assignedAdvocate?.name || '-' },
                    { label: 'Type', value: caseData.caseType || '-' },
                    { label: 'Next Hearing', value: nextH ? new Date(nextH.hearingDate).toLocaleDateString() : 'TBD' }
                  ].map((it, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.55rem' }}>{it.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, display: 'block' }}>{it.value}</Typography>
                    </Grid>
                  ))}
                  {caseData.description && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.55rem' }}>Description</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: 'text.secondary' }}>{caseData.description}</Typography>
                    </Grid>
                  )}
                  {caseData.clients?.length > 0 && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.55rem', mb: 1, display: 'block' }}>Client Details</Typography>
                      <Grid container spacing={1}>
                        {caseData.clients.map(cl => (
                          <Grid item xs={12} sm={6} key={cl.id}>
                            <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                              <Typography variant="caption" sx={{ fontWeight: 900, display: 'block' }}>{cl.name}</Typography>
                              <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <WhatsAppIcon sx={{ fontSize: 12, color: 'success.main' }} /> {cl.phone || '-'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{cl.email || ''}</Typography>
                              </Stack>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.55rem', mb: 1, display: 'block' }}>Case Status</Typography>
                {locked ? (
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main', display: 'block' }}>CLOSED</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>Outcome: {caseData.outcome || '-'}</Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>Case is currently active.</Typography>
                    {isAdmin && (
                      <Button fullWidth size="small" variant="contained" color="success" onClick={() => { setDisposeForm({status:'Disposed', disposalDate: new Date().toISOString().split('T')[0]}); setDisposeOpen(true); }} sx={{ fontWeight: 900 }}>Close Case</Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Stack spacing={2}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Hearings</Typography>
                    {!locked && canEdit && <Button size="small" onClick={() => { setHearingForm({}); setHearingOpen(true); }} sx={{ fontSize: '0.7rem' }}>+ Add</Button>}
                  </Stack>
                  <Box sx={{ pl: 1 }}>
                    {(caseData.hearings || []).map((h, i) => (
                      <TimelineItem key={h.id} isLast={i===(caseData.hearings.length-1)} date={new Date(h.hearingDate).toLocaleDateString()} title={`Hearing #${i+1}`} subtitle={h.notes} />
                    ))}
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Notes</Typography>
                    {!locked && <Button size="small" onClick={() => { setUpdateForm({}); setUpdateOpen(true); }} sx={{ fontSize: '0.7rem' }}>+ {UI_ACTIONS.ADD}</Button>}
                  </Stack>
                  <Stack spacing={1}>
                    {(caseData.updates || []).map(u => (
                      <Box key={u.id} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{u.authorName} • {new Date(u.createdAt).toLocaleDateString()}</Typography>
                        <Typography variant="caption">{u.updateText}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5 }}>Documents</Typography>
                {!locked && (
                  <Stack direction="row" spacing={1} mb={2}>
                    <TextField size="small" type="file" fullWidth onChange={e => setFile(e.target.files[0])} InputProps={{ sx: { fontSize: '0.7rem' } }} />
                    <Button size="small" variant="contained" disabled={!file || uploading} onClick={handleUpload}>{uploading?'...':'Ups'}</Button>
                  </Stack>
                )}
                <Stack spacing={1}>
                  {(caseData.documents || []).map(d => (
                    <Box key={d.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', noWrap: true }}>{d.originalFilename}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{d.documentType}</Typography>
                      </Box>
                      <Stack direction="row">
                        <IconButton size="small" onClick={() => handleDownload(d)}><DownloadIcon sx={{ fontSize: 16 }} /></IconButton>
                        {!locked && isAdmin && <IconButton size="small" color="error" onClick={() => handleDeleteDoc(d.id)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      {/* Dialogs */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Edit Case</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                label="Case Title" 
                size="small" 
                fullWidth 
                value={caseForm.title || ''} 
                onChange={e => setCaseForm({...caseForm, title: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Case Number" 
                size="small" 
                fullWidth 
                value={caseForm.caseNumber || ''} 
                onChange={e => setCaseForm({...caseForm, caseNumber: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Case Type" 
                size="small" 
                fullWidth 
                placeholder="e.g. OS, OP, CC"
                value={caseForm.caseType || ''} 
                onChange={e => setCaseForm({...caseForm, caseType: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Case Group</InputLabel>
                <Select 
                  label="Case Group" 
                  value={caseForm.caseGroup || 'Civil'} 
                  onChange={e => setCaseForm({...caseForm, caseGroup: e.target.value})}
                >
                  <MenuItem value="Civil">Civil</MenuItem>
                  <MenuItem value="Criminal">Criminal</MenuItem>
                  <MenuItem value="Consumer">Consumer</MenuItem>
                  <MenuItem value="Family">Family</MenuItem>
                  <MenuItem value="Writ">Writ</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label={LEGAL_TERMS.COURT} 
                size="small" 
                fullWidth 
                value={caseForm.courtName || ''} 
                onChange={e => setCaseForm({...caseForm, courtName: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label={LEGAL_TERMS.DISTRICT} 
                size="small" 
                fullWidth 
                value={caseForm.district || ''} 
                onChange={e => setCaseForm({...caseForm, district: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Advocate</InputLabel>
                <Select 
                  label="Advocate" 
                  value={caseForm.assignedAdvocateId || ''} 
                  onChange={e => setCaseForm({...caseForm, assignedAdvocateId: e.target.value})}
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
                  value={caseForm.clientIds || []} 
                  onChange={e => setCaseForm({...caseForm, clientIds: e.target.value})}
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
                label="Next Hearing" 
                type="date" 
                size="small" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                value={caseForm.nextHearingDate || ''} 
                onChange={e => setCaseForm({...caseForm, nextHearingDate: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Next Purpose" 
                size="small" 
                fullWidth 
                value={caseForm.nextPurpose || ''} 
                onChange={e => setCaseForm({...caseForm, nextPurpose: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Description" 
                multiline 
                rows={3} 
                size="small" 
                fullWidth 
                value={caseForm.description || ''} 
                onChange={e => setCaseForm({...caseForm, description: e.target.value})} 
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{UI_ACTIONS.CANCEL}</Button>
          <Button variant="contained" onClick={handleUpdate} sx={{ fontWeight: 900 }}>{UI_ACTIONS.SAVE}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={hearingOpen} onClose={() => setHearingOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Add Hearing</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Stack spacing={2}>
            <TextField label="Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={hearingForm.hearingDate || ''} onChange={e => setHearingForm({...hearingForm, hearingDate: e.target.value})} />
            <TextField label="Notes" multiline rows={2} size="small" fullWidth value={hearingForm.notes || ''} onChange={e => setHearingForm({...hearingForm, notes: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setHearingOpen(false)}>{UI_ACTIONS.CANCEL}</Button><Button variant="contained" onClick={handleHearing}>{UI_ACTIONS.SAVE}</Button></DialogActions>
      </Dialog>

      <Dialog open={updateOpen} onClose={() => setUpdateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Add Note</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <TextField label="Note" multiline rows={3} size="small" fullWidth value={updateForm.updateText || ''} onChange={e => setUpdateForm({...updateForm, updateText: e.target.value})} />
        </DialogContent>
        <DialogActions><Button onClick={() => setUpdateOpen(false)}>{UI_ACTIONS.CANCEL}</Button><Button variant="contained" onClick={handleAddNote}>{UI_ACTIONS.SAVE}</Button></DialogActions>
      </Dialog>

      <Dialog open={disposeOpen} onClose={() => setDisposeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Close Case</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={disposeForm.status || 'Disposed'} onChange={e => setDisposeForm({...disposeForm, status: e.target.value})}>
                <MenuItem value="Disposed">Disposed</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={disposeForm.disposalDate || ''} onChange={e => setDisposeForm({...disposeForm, disposalDate: e.target.value})} />
            <TextField label="Outcome" multiline rows={2} size="small" fullWidth value={disposeForm.outcome || ''} onChange={e => setDisposeForm({...disposeForm, outcome: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setDisposeOpen(false)}>{UI_ACTIONS.CANCEL}</Button><Button variant="contained" color="success" onClick={handleFinalize}>Confirm</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 1 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
