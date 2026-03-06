import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
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

import { ReportsApi } from '../services/api';

export default function ReportsPage() {
  const [byDistrict, setByDistrict] = useState([]);
  const [byAdvocate, setByAdvocate] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  const [range, setRange] = useState({ from: '', to: '' });

  const defaultRange = useMemo(() => {
    const d = new Date();
    const from = new Date(d);
    const to = new Date(d);
    to.setDate(to.getDate() + 30);
    const f = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
    const t = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
    return { from: f, to: t };
  }, []);

  const load = async (opts) => {
    const [dRes, aRes] = await Promise.all([ReportsApi.casesByDistrict(), ReportsApi.casesByAdvocate()]);
    setByDistrict(dRes.data);
    setByAdvocate(aRes.data);

    if (opts?.from && opts?.to) {
      const uRes = await ReportsApi.upcomingHearings({ from: opts.from, to: opts.to });
      setUpcoming(uRes.data);
    }
  };

  useEffect(() => {
    setRange(defaultRange);
    load(defaultRange);
  }, [defaultRange]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Reports</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Cases by District
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>District</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {byDistrict.map((r) => (
                    <TableRow key={r.district}>
                      <TableCell>{r.district}</TableCell>
                      <TableCell align="right">{r.count}</TableCell>
                    </TableRow>
                  ))}
                  {byDistrict.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>No data.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Cases by Advocate (by advocateId)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Advocate ID</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {byAdvocate.map((r) => (
                    <TableRow key={String(r.advocateId)}>
                      <TableCell>{r.advocateId ?? '(Unassigned)'}</TableCell>
                      <TableCell align="right">{r.count}</TableCell>
                    </TableRow>
                  ))}
                  {byAdvocate.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>No data.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Upcoming Hearings
                </Typography>
                <TextField
                  label="From"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={range.from}
                  onChange={(e) => setRange((s) => ({ ...s, from: e.target.value }))}
                />
                <TextField
                  label="To"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={range.to}
                  onChange={(e) => setRange((s) => ({ ...s, to: e.target.value }))}
                />
                <Button variant="contained" onClick={() => load(range)}>
                  Run
                </Button>
              </Stack>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Case</TableCell>
                    <TableCell>Court</TableCell>
                    <TableCell>Advocate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcoming.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.nextHearingDate}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>{c.courtName || '-'}</TableCell>
                      <TableCell>{c.assignedAdvocate?.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {upcoming.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>No upcoming hearings in range.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
