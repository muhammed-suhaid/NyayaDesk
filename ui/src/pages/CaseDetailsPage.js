import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import { CasesApi } from '../services/api';

export default function CaseDetailsPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState({ type: '', message: '' });
  const [uploadError, setUploadError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [item, setItem] = useState(null);
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);

  const id = useMemo(() => Number(caseId), [caseId]);

  const load = async () => {
    const [caseRes, docsRes] = await Promise.all([CasesApi.get(id), CasesApi.listDocuments(id)]);
    setItem(caseRes.data);
    setDocs(docsRes.data);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!item) return <Typography>Loading...</Typography>;

  const onUpload = async () => {
    setUploadError('');
    if (!file) {
      setUploadError('Please select a file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be 10MB or less');
      return;
    }
    setStatus({ type: '', message: '' });
    try {
      await CasesApi.uploadDocument(id, file);
      setFile(null);
      setStatus({ type: 'success', message: 'Document uploaded' });
      await load();
    } catch (e) {
      setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to upload document' });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Case Details</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate('/cases')}>Back</Button>
          <Button
            color="error"
            onClick={async () => {
              await CasesApi.remove(id);
              navigate('/cases');
            }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">{item.title}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Status: ${item.currentStatus || '-'}`} />
              <Chip label={`Next hearing: ${item.nextHearingDate || '-'}`} />
              <Chip label={`Court: ${item.courtName || '-'}`} />
              <Chip label={`District: ${item.district || '-'}`} />
            </Stack>
            <Divider />
            <Typography variant="body2">{item.description || 'No description.'}</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Documents
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                type="file"
                inputProps={{ accept: '.pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp' }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                disabled={!file}
                onClick={onUpload}
              >
                Upload
              </Button>
              {uploadError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {uploadError}
                </Alert>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>File</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.originalFilename}</TableCell>
                    <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Button
                          size="small"
                          component="a"
                          href={CasesApi.downloadUrl(id, d.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={deletingId === d.id}
                          onClick={async () => {
                            if (deletingId) return;
                            setDeletingId(d.id);
                            setStatus({ type: '', message: '' });
                            try {
                              await CasesApi.deleteDocument(id, d.id);
                              setStatus({ type: 'success', message: 'Document deleted' });
                              await load();
                            } catch (e) {
                              setStatus({ type: 'error', message: e?.response?.data?.error || 'Unable to delete document' });
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {docs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No documents uploaded.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
