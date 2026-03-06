import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useNavigate } from 'react-router-dom';

import { isAuthenticated } from '../auth';

const FeatureCard = ({ icon, title, description }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: '#c9a227' }}>{icon}</Box>
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Box
        sx={{
          position: 'relative',
          bgcolor: '#111111',
          color: '#ffffff',
          py: { xs: 8, md: 12 },
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #ffffff 0, transparent 40%), radial-gradient(circle at 80% 70%, #c9a227 0, transparent 45%)',
          }}
        />

        <Container sx={{ position: 'relative' }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.8 }}>
                  Kerala Legal Practice Suite
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  NyayaDesk – Smart Legal Case Management System
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  A modern digital platform for managing legal cases, clients, advocates, and court schedules for law offices in Kerala.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
                  <Button
                    size="large"
                    variant="contained"
                    onClick={() => navigate('/login')}
                    sx={{ bgcolor: '#ffffff', color: '#111111', '&:hover': { bgcolor: '#f5f5f5' } }}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    onClick={() => navigate('/register')}
                    sx={{ borderColor: 'rgba(255,255,255,0.35)', color: '#ffffff' }}
                  >
                    Get Started
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: '#ffffff',
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Built for advocates. Designed like court dress.
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Minimal. Elegant. Professional. A black & white interface with a premium gold accent—tailored for Kerala law offices.
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ opacity: 0.75 }}>
                          Example modules
                        </Typography>
                        <Typography variant="body2">Case Management, Hearings, Documents, Attendance, Leave, Reports</Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Features
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Everything your office needs to track cases, clients, advocates, hearings, and documents—without clutter.
          </Typography>
        </Stack>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <FeatureCard icon={<GavelIcon />} title="Case Management" description="Track and manage legal cases efficiently." />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard icon={<PeopleIcon />} title="Client Management" description="Maintain organized client records." />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard icon={<AccountBoxIcon />} title="Advocate Management" description="Manage advocates working under the law office." />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard icon={<EventAvailableIcon />} title="Attendance Tracking" description="Track attendance of advocates and staff." />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard icon={<AssignmentTurnedInIcon />} title="Leave Requests" description="Submit and approve leave requests." />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard icon={<DescriptionIcon />} title="Document Management" description="Upload and manage case-related documents." />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard icon={<AssessmentIcon />} title="Reports & Insights" description="Generate reports for cases, hearings, and advocates." />
          </Grid>
        </Grid>

        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  System Overview
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  NyayaDesk helps law offices run on a single source of truth.
                </Typography>
              </Stack>
              <Stack spacing={1.25} sx={{ mt: 2 }}>
                <Typography variant="body2">Centralized legal case tracking</Typography>
                <Typography variant="body2">Court hearing reminders</Typography>
                <Typography variant="body2">Advocate workload management</Typography>
                <Typography variant="body2">Secure document storage</Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Start managing your legal practice with NyayaDesk today.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clean workflows. Better visibility. Professional interface.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/login')}
                      sx={{
                        mt: 1,
                        bgcolor: '#111111',
                        '&:hover': { bgcolor: '#000000' },
                      }}
                    >
                      Login to NyayaDesk
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} NyayaDesk
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
