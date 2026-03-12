import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, TextField,
  Typography, Table, TableBody, TableCell, TableHead, TableRow, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl,
  IconButton, Tooltip
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

import { useNavigate, useParams } from 'react-router-dom';
import { CasesApi, AdvocatesApi, ClientsApi } from '../services/api';
import { getRole } from '../auth';

const STATUS_COLORS = {
  'Open': 'info',
  'In Progress': 'warning',
  'Disposed': 'success',
  'Closed': 'default'
};

const TimelineItemCustom = ({ date, title, subtitle, isLast, color = 'primary.main', dotSize = 8 }) => (
  <Box sx={{ display: 'flex', position: 'relative', pb: isLast ? 0 : 3 }}>
    {!isLast && (
      <Box sx={{ position: 'absolute', top: 24, bottom: -8, left: '11px', borderLeft: '2px dashed', borderColor: 'divider' }} />
    )}
    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2, flexShrink: 0, mt: 0.5 }}>
      <Box sx={{ width: dotSize, height: dotSize, borderRadius: '50%', bgcolor: color }} />
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{date}</Typography>
      <Typography variant="body2" fontWeight={700} color="text.primary">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{subtitle}</Typography>}
    </Box>
  </Box>
);

export default function CaseDetailsPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isAdvocate = role === 'advocate';
  const canEditDetails = isAdmin || isAdvocate;

  const [caseData, setCaseData] = useState(null);
  const [advocates, setAdvocates] = useState([]);
  const [clients, setClients] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog states
  const [editCaseOpen, setEditCaseOpen] = useState(false);
  const [hearingOpen, setHearingOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [disposeOpen, setDisposeOpen] = useState(false);

  // Form states
  const [caseForm, setCaseForm] = useState({});
  const [hearingForm, setHearingForm] = useState({});
  const [updateForm, setUpdateForm] = useState({});
  const [disposeForm, setDisposeForm] = useState({ status: 'Disposed' });
  
  // Document upload state
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('Evidence');
  const [uploading, setUploading] = useState(false);

  const id = useMemo(() => Number(caseId), [caseId]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadData = async () => {
    try {
      const [caseRes, advRes, clientRes] = await Promise.all([
        CasesApi.get(id),
        (isAdmin || isAdvocate) ? AdvocatesApi.list({}) : Promise.resolve({ data: [] }),
        (isAdmin || isAdvocate) ? ClientsApi.list({}) : Promise.resolve({ data: [] })
      ]);
      setCaseData(caseRes.data);
      if (isAdmin || isAdvocate) {
        setAdvocates(advRes.data);
        setClients(clientRes.data);
      }
    } catch (err) {
      showSnackbar('Error loading case details', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Next Hearing Logic
  const upcomingHearing = useMemo(() => {
    if (!caseData || !caseData.hearings || caseData.hearings.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter future and sort ascending
    const future = caseData.hearings
      .filter(h => new Date(h.hearingDate) >= today)
      .sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate));
    
    return future[0] || null;
  }, [caseData]);

  if (!caseData) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  const isLocked = ['Disposed', 'Closed'].includes(caseData.currentStatus);

  const getHearingBadge = (hDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(hDate);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { label: 'TODAY', color: '#f59e0b' }; // Orange
    if (diffDays === 1) return { label: 'TOMORROW', color: '#eab308' }; // Yellow
    return null;
  };

  // Activity Timeline Processing
  const activities = [
    { id: 'created', date: caseData.createdAt, title: 'Case Created', subtitle: `Registered in system` }
  ];
  (caseData.hearings || []).forEach(h => {
    activities.push({ id: `h-${h.id}`, date: h.createdAt, title: `Hearing Added`, subtitle: `Date: ${h.hearingDate}\nNotes: ${h.notes || '-'}` });
  });
  (caseData.updates || []).forEach(u => {
    activities.push({ id: `u-${u.id}`, date: u.createdAt, title: `Update by ${u.authorName}`, subtitle: u.updateText });
  });
  (caseData.documents || []).forEach(d => {
    activities.push({ id: `d-${d.id}`, date: d.createdAt, title: `Document Uploaded: ${d.documentType}`, subtitle: `${d.originalFilename} uploaded by ${d.uploadedBy}` });
  });
  if (caseData.disposalDate || isLocked) {
    activities.push({ id: 'disposed', date: caseData.disposalDate || caseData.updatedAt, title: `Case ${caseData.currentStatus}`, subtitle: `Reason: ${caseData.disposalReason || '-'}\nOutcome: ${caseData.outcome || '-'}` });
  }
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Handlers
  const handleEditCaseSave = async () => {
    try {
      await CasesApi.update(id, caseForm);
      showSnackbar('Case updated successfully');
      setEditCaseOpen(false);
      loadData();
    } catch (e) {
      showSnackbar(e?.response?.data?.error || 'Error updating case', 'error');
    }
  };

  const handleHearingSave = async () => {
    try {
      if (hearingForm.id) {
        await CasesApi.updateHearing(id, hearingForm.id, hearingForm);
        showSnackbar('Hearing updated');
      } else {
        await CasesApi.addHearing(id, hearingForm);
        showSnackbar('Hearing added');
      }
      setHearingOpen(false);
      loadData();
    } catch (e) {
      showSnackbar(e?.response?.data?.error || 'Error saving hearing', 'error');
    }
  };

  const handleHearingDelete = async (hearingId) => {
    if (!window.confirm("Delete this hearing?")) return;
    try {
      await CasesApi.deleteHearing(id, hearingId);
      showSnackbar('Hearing deleted');
      loadData();
    } catch (e) {
      showSnackbar('Error deleting hearing', 'error');
    }
  };

  const handleUpdateSave = async () => {
    try {
      await CasesApi.addUpdate(id, updateForm);
      showSnackbar('Update added');
      setUpdateOpen(false);
      loadData();
    } catch (e) {
      showSnackbar(e?.response?.data?.error || 'Error adding update', 'error');
    }
  };

  const handleDisposeSave = async () => {
    try {
      await CasesApi.disposeCase(id, disposeForm);
      showSnackbar(`Case marked as ${disposeForm.status}`);
      setDisposeOpen(false);
      loadData();
    } catch (e) {
      showSnackbar(e?.response?.data?.error || 'Error disposing case', 'error');
    }
  };

  const handleUploadDoc = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await CasesApi.uploadDocument(id, file, docType);
      setFile(null);
      showSnackbar('Document uploaded');
      loadData();
    } catch (e) {
      showSnackbar(e?.response?.data?.error || 'Error uploading document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await CasesApi.deleteDocument(id, docId);
      showSnackbar('Document deleted');
      loadData();
    } catch (e) {
      showSnackbar('Error deleting document', 'error');
    }
  };

  const downloadBlob = async (blob, filename) => {
    if (blob.type === 'application/json') {
      const text = await blob.text();
      try {
        const err = JSON.parse(text);
        showSnackbar(err.error || 'Server error during download', 'error');
        return;
      } catch (e) {}
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  };

  const handleDownloadReport = async () => {
    try {
      showSnackbar('Generating report...', 'info');
      const res = await CasesApi.downloadReport(id);
      const filename = `Case_Report_${(caseData.caseNumber || 'NA').replace(/[/\\\\]/g, '_')}.pdf`;
      await downloadBlob(res.data, filename);
    } catch (e) {
      console.error('Report download error:', e);
      let msg = 'Error downloading report';
      if (e.response?.data instanceof Blob) {
        const text = await e.response.data.text();
        try {
          const err = JSON.parse(text);
          msg = err.error || msg;
        } catch (parseErr) {}
      } else if (e.response?.data?.error) {
        msg = e.response.data.error;
      }
      showSnackbar(msg, 'error');
    }
  };

  const handleDownloadDoc = async (doc) => {
    try {
      const res = await CasesApi.downloadDocument(id, doc.id);
      await downloadBlob(res.data, doc.originalFilename);
    } catch (e) {
      console.error('Document download error:', e);
      showSnackbar('Error downloading document', 'error');
    }
  };

  const handleWhatsAppShare = () => {
    const client = caseData.clients?.[0];
    if (!client || !client.phone) {
      showSnackbar('No client phone number found for WhatsApp share', 'warning');
      return;
    }
    
    const message = `Case Report for Case No: ${caseData.caseNumber || 'N/A'}

Court: ${caseData.courtName || 'N/A'}
Next Hearing: ${upcomingHearing ? new Date(upcomingHearing.hearingDate).toLocaleDateString() : 'No upcoming hearing'}
Status: ${caseData.currentStatus || 'Open'}

Generated from NyayaDesk.`;

    let phoneNum = client.phone.replace(/\D/g, '');
    if (phoneNum.length === 10) {
      phoneNum = '91' + phoneNum;
    }

    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 1200, mx: 'auto', p: 1 }}>
      {/* Disposal Banner */}
      {isLocked && (
        <Alert severity="info" icon={<LockIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>
          This case has been {caseData.currentStatus.toLowerCase()} and cannot be modified.
        </Alert>
      )}

      {/* 1. Case Overview Card */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
                {caseData.title}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Chip 
                  label={caseData.currentStatus || 'Open'} 
                  color={STATUS_COLORS[caseData.currentStatus] || 'primary'} 
                  size="small" 
                  sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} 
                />
                <Typography variant="body2" color="text.secondary">Case No: {caseData.caseNumber || 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary">Filed: {new Date(caseData.createdAt).toLocaleDateString()}</Typography>
              </Stack>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Download PDF Report">
                <Button 
                  variant="outlined" 
                  onClick={handleDownloadReport}
                  startIcon={<DownloadIcon />}
                >
                  Report
                </Button>
              </Tooltip>
              <Tooltip title="Send to Client WhatsApp">
                <Button variant="outlined" startIcon={<WhatsAppIcon />} color="success" onClick={handleWhatsAppShare}>
                  WhatsApp
                </Button>
              </Tooltip>
              {!isLocked && canEditDetails && (
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => {
                  setCaseForm({
                    title: caseData.title,
                    caseNumber: caseData.caseNumber,
                    courtName: caseData.courtName,
                    district: caseData.district,
                    assignedAdvocateId: caseData.assignedAdvocateId,
                    caseType: caseData.caseType,
                    currentStatus: caseData.currentStatus,
                    clientIds: (caseData.clients || []).map(c => c.id)
                  });
                  setEditCaseOpen(true);
                }}>
                  Edit
                </Button>
              )}
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Court & District</Typography>
              <Typography variant="body1" fontWeight={500} mt={0.5}>{caseData.courtName || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary">{caseData.district || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Case Type</Typography>
              <Typography variant="body1" fontWeight={500} mt={0.5}>{caseData.caseType || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Assigned Advocate</Typography>
              <Typography variant="body1" fontWeight={500} mt={0.5}>{caseData.assignedAdvocate?.name || 'Unassigned'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>Next Hearing</Typography>
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" fontWeight={500} color={upcomingHearing ? 'primary.main' : 'text.primary'}>
                  {upcomingHearing ? new Date(upcomingHearing.hearingDate).toLocaleDateString() : 'No upcoming hearing'}
                </Typography>
                {upcomingHearing && getHearingBadge(upcomingHearing.hearingDate) && (
                  <Chip 
                    label={getHearingBadge(upcomingHearing.hearingDate).label}
                    size="small"
                    sx={{ bgcolor: getHearingBadge(upcomingHearing.hearingDate).color, color: 'white', fontWeight: 800, fontSize: '0.65rem', height: 18 }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column: Hearings & Updates */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* 2. Hearing Timeline */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight={700}>Hearings Timeline</Typography>
                  {!isLocked && (isAdmin || isAdvocate) && (
                    <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => {
                      setHearingForm({}); setHearingOpen(true);
                    }}>
                      Add Hearing
                    </Button>
                  )}
                </Stack>
                {(!caseData.hearings || caseData.hearings.length === 0) ? (
                  <Typography variant="body2" color="text.secondary">No hearings recorded.</Typography>
                ) : (
                  <Box sx={{ pl: 2, pt: 1 }}>
                    {caseData.hearings.map((h, idx) => (
                      <TimelineItemCustom 
                        key={h.id}
                        isLast={idx === caseData.hearings.length - 1}
                        date={new Date(h.hearingDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                        title={idx === 0 ? "First Hearing" : `Hearing #${idx + 1}`}
                        color={idx === 0 ? 'primary.main' : 'secondary.main'}
                        subtitle={`Notes: ${h.notes || '-'}\nOutcome: ${h.outcome || 'Pending'}`}
                        // Add action buttons inside if admin
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* 3. Case Updates */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight={700}>Case Updates & Notes</Typography>
                  {!isLocked && (
                    <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => {
                      setUpdateForm({ updateText: '' }); setUpdateOpen(true);
                    }}>
                      Add Note
                    </Button>
                  )}
                </Stack>
                {(!caseData.updates || caseData.updates.length === 0) ? (
                  <Typography variant="body2" color="text.secondary">No updates yet.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {caseData.updates.map(u => (
                      <Box key={u.id}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {new Date(u.createdAt).toLocaleString()} • {u.authorName}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                          {u.updateText}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column: Resolution & Documents */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* 4. Case Disposal */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Case Resolution</Typography>
                {isLocked ? (
                  <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                    <Stack direction="row" spacing={1} alignItems="center" color="success.main" mb={1}>
                      <CheckCircleOutlineIcon />
                      <Typography variant="subtitle2" fontWeight={700}>Case {caseData.currentStatus}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary"><strong>Date:</strong> {caseData.disposalDate || 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>Reason:</strong> {caseData.disposalReason || 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>Outcome:</strong> {caseData.outcome || 'N/A'}</Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      This case is currently active.
                    </Typography>
                    {isAdmin && (
                      <Button variant="contained" color="success" fullWidth onClick={() => {
                        setDisposeForm({ status: 'Disposed', disposalDate: new Date().toISOString().split('T')[0], disposalReason: '', outcome: '' });
                        setDisposeOpen(true);
                      }}>
                        Resolve Case
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* 5. Documents Section */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={3}>Documents</Typography>
                
                {/* Upload Area */}
                {!isLocked && (
                  <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, mb: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" fontWeight={600} mb={1}>Upload New Document</Typography>
                    <Stack spacing={2}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Document Type</InputLabel>
                        <Select value={docType} label="Document Type" onChange={(e) => setDocType(e.target.value)}>
                          <MenuItem value="Evidence">Evidence</MenuItem>
                          <MenuItem value="Petition">Petition</MenuItem>
                          <MenuItem value="Order">Order</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          fullWidth
                          type="file"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <Button 
                          variant="contained" 
                          disabled={!file || uploading} 
                          onClick={handleUploadDoc}
                          startIcon={<UploadFileIcon />}
                          sx={{ minWidth: 100 }}
                        >
                          {uploading ? '...' : 'Upload'}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                )}

                <Stack spacing={2}>
                  {(!caseData.documents || caseData.documents.length === 0) ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center">No documents uploaded.</Typography>
                  ) : (
                    caseData.documents.map(d => (
                      <Box key={d.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: 'hidden' }}>
                          <Box sx={{ width: 32, height: 32, bgcolor: 'primary.50', color: 'primary.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <DescriptionIcon fontSize="small" />
                          </Box>
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" fontWeight={600} noWrap title={d.originalFilename}>
                              {d.originalFilename}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {d.documentType} • By {d.uploadedBy || 'Unknown'} • {new Date(d.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" flexShrink={0}>
                          <IconButton size="small" onClick={() => handleDownloadDoc(d)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          {isAdmin && !isLocked && (
                            <IconButton size="small" color="error" onClick={() => handleDeleteDoc(d.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>

          </Stack>
        </Grid>

        {/* Bottom: 6. Activity Timeline */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={3}>Activity Timeline</Typography>
              <Box sx={{ pl: 2, pt: 1 }}>
                {activities.map((act, index) => (
                  <TimelineItemCustom 
                    key={act.id} 
                    date={new Date(act.date).toLocaleString()} 
                    title={act.title} 
                    subtitle={act.subtitle} 
                    isLast={index === activities.length - 1} 
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* ================= MODALS ================= */}

      {/* Edit Case Modal */}
      <Dialog open={editCaseOpen} onClose={() => setEditCaseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Case Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} pt={1}>
            <TextField label="Case Title" fullWidth value={caseForm.title || ''} onChange={e => setCaseForm({...caseForm, title: e.target.value})} />
            <TextField label="Case Number" fullWidth value={caseForm.caseNumber || ''} onChange={e => setCaseForm({...caseForm, caseNumber: e.target.value})} />
            <TextField label="Court Name" fullWidth value={caseForm.courtName || ''} onChange={e => setCaseForm({...caseForm, courtName: e.target.value})} />
            <TextField label="District" fullWidth value={caseForm.district || ''} onChange={e => setCaseForm({...caseForm, district: e.target.value})} />
            <TextField label="Case Type" fullWidth value={caseForm.caseType || ''} onChange={e => setCaseForm({...caseForm, caseType: e.target.value})} />
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={caseForm.currentStatus || 'Open'} onChange={e => setCaseForm({...caseForm, currentStatus: e.target.value})}>
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Disposed">Disposed</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!isAdmin}>
              <InputLabel>Assigned Advocate</InputLabel>
              <Select label="Assigned Advocate" value={caseForm.assignedAdvocateId || ''} onChange={e => setCaseForm({...caseForm, assignedAdvocateId: e.target.value})}>
                <MenuItem value=""><em>None</em></MenuItem>
                {advocates.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Clients</InputLabel>
              <Select 
                multiple 
                label="Clients" 
                value={caseForm.clientIds || []} 
                onChange={e => setCaseForm({...caseForm, clientIds: e.target.value})}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={clients.find(c => c.id === value)?.name || value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {clients.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCaseOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditCaseSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Hearing Modal */}
      <Dialog open={hearingOpen} onClose={() => setHearingOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{hearingForm.id ? "Edit Hearing" : "Add Hearing"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} pt={1}>
            <TextField 
              label="Hearing Date" 
              type="date" 
              InputLabelProps={{ shrink: true }} 
              fullWidth 
              value={hearingForm.hearingDate || ''} 
              onChange={e => setHearingForm({...hearingForm, hearingDate: e.target.value})} 
            />
            <TextField 
              label="Notes / Purpose" 
              multiline rows={3} fullWidth 
              value={hearingForm.notes || ''} 
              onChange={e => setHearingForm({...hearingForm, notes: e.target.value})} 
            />
            <TextField 
              label="Outcome" 
              fullWidth 
              value={hearingForm.outcome || ''} 
              onChange={e => setHearingForm({...hearingForm, outcome: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHearingOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleHearingSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Update Modal */}
      <Dialog open={updateOpen} onClose={() => setUpdateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Case Update</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} pt={1}>
            <TextField 
              label="Update Details" 
              multiline rows={4} fullWidth 
              placeholder="e.g. Client submitted additional documents..."
              value={updateForm.updateText || ''} 
              onChange={e => setUpdateForm({...updateForm, updateText: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateSave} disabled={!updateForm.updateText}>Add Update</Button>
        </DialogActions>
      </Dialog>

      {/* Dispose Case Modal */}
      <Dialog open={disposeOpen} onClose={() => setDisposeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Case</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} pt={1}>
            <FormControl fullWidth>
              <InputLabel>Resolution Type</InputLabel>
              <Select label="Resolution Type" value={disposeForm.status || 'Disposed'} onChange={e => setDisposeForm({...disposeForm, status: e.target.value})}>
                <MenuItem value="Disposed">Disposed</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Resolution Date" 
              type="date" 
              InputLabelProps={{ shrink: true }} 
              fullWidth 
              value={disposeForm.disposalDate || ''} 
              onChange={e => setDisposeForm({...disposeForm, disposalDate: e.target.value})} 
            />
            <TextField 
              label="Reason / Remarks" 
              multiline rows={2} fullWidth 
              value={disposeForm.disposalReason || ''} 
              onChange={e => setDisposeForm({...disposeForm, disposalReason: e.target.value})} 
            />
            <TextField 
              label="Outcome / Verdict" 
              multiline rows={2} fullWidth 
              placeholder="e.g. Case disposed in favor of client."
              value={disposeForm.outcome || ''} 
              onChange={e => setDisposeForm({...disposeForm, outcome: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisposeOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleDisposeSave}>Confirm Resolution</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Stack>
  );
}
