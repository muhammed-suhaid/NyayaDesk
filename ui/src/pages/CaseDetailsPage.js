import React, { useEffect, useMemo, useState } from 'react';
import {
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
                onClick={async () => {
                  await CasesApi.uploadDocument(id, file);
                  setFile(null);
                  await load();
                }}
              >
                Upload
              </Button>
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
                          onClick={async () => {
                            await CasesApi.deleteDocument(id, d.id);
                            await load();
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
