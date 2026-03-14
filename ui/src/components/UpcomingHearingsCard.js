import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  CircularProgress,
  List,
  ListItem,
  Stack,
  Avatar,
  alpha,
  useTheme,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { HearingsApi } from '../services/api';
import { LEGAL_TERMS, UI_ACTIONS, MESSAGES } from '../constants';

const UpcomingHearingsCard = () => {
  const theme = useTheme();
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadHearings = async () => {
    try {
      const res = await HearingsApi.getUpcoming();
      setHearings(res.data);
    } catch (error) {
      console.error('Failed to load upcoming hearings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHearings();
  }, []);

  const getGroupedHearings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);

    return {
      today: hearings.filter((h) => h.hearingDate === todayStr),
      tomorrow: hearings.filter((h) => h.hearingDate === tomorrowStr),
      upcoming: hearings.filter((h) => h.hearingDate > tomorrowStr && h.hearingDate <= formatDate(nextWeek)),
    };
  };

  if (loading) {
    return (
      <Card sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, border: '1px solid', borderColor: 'divider' }}>
        <CircularProgress size={24} />
      </Card>
    );
  }

  const grouped = getGroupedHearings();

  const renderHearingItem = (h) => (
    <ListItem 
      key={h.id} 
      sx={{ 
        px: 2, py: 2, 
        borderRadius: 4, 
        mb: 1,
        transition: 'all 0.2s',
        '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
      }}
      onClick={() => navigate(`/cases/${h.caseId}`)}
    >
      <Stack direction="row" spacing={2} sx={{ width: '100%' }} alignItems="center">
        <Box sx={{ 
          bgcolor: alpha(theme.palette.primary.main, 0.05), 
          color: 'primary.main', 
          p: 1, borderRadius: 3, 
          textAlign: 'center', minWidth: 48 
        }}>
          <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', lineHeight: 1 }}>
            {new Date(h.hearingDate).toLocaleDateString(undefined, { day: '2-digit' })}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
            {new Date(h.hearingDate).toLocaleDateString(undefined, { month: 'short' })}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{h.caseTitle}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{h.court}</Typography>
          </Stack>
        </Box>
        <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
      </Stack>
    </ListItem>
  );

  const SectionHeader = ({ title, count }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3, mb: 1, px: 2 }}>
      <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: '0.1em', fontSize: '0.7rem' }}>
        {title}
      </Typography>
      {count > 0 && (
        <Typography variant="caption" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', px: 1, borderRadius: 1, fontWeight: 800 }}>
          {count}
        </Typography>
      )}
    </Stack>
  );

  return (
    <Card sx={{ 
      boxShadow: 'none', 
      borderRadius: 5,
      border: '1px solid',
      borderColor: 'divider',
      height: '100%'
    }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>
              <CalendarMonthIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>{LEGAL_TERMS.HEARINGS}</Typography>
          </Stack>
          <Button size="small" sx={{ fontWeight: 800 }} onClick={() => navigate('/cases')}>{UI_ACTIONS.VIEW_ALL}</Button>
        </Box>

        <Box sx={{ pb: 3 }}>
          <SectionHeader title="Today" count={grouped.today.length} />
          <List dense sx={{ px: 1 }}>
            {grouped.today.length > 0 ? grouped.today.map(renderHearingItem) : (
              <Typography variant="caption" color="text.disabled" sx={{ px: 2, py: 1, display: 'block' }}>{MESSAGES.NO_HEARINGS_TODAY}</Typography>
            )}
          </List>

          <SectionHeader title="Tomorrow" count={grouped.tomorrow.length} />
          <List dense sx={{ px: 1 }}>
            {grouped.tomorrow.length > 0 ? grouped.tomorrow.map(renderHearingItem) : (
              <Typography variant="caption" color="text.disabled" sx={{ px: 2, py: 1, display: 'block' }}>{MESSAGES.NO_HEARINGS_TOMORROW}</Typography>
            )}
          </List>

          <SectionHeader title="Next 7 Days" count={grouped.upcoming.length} />
          <List dense sx={{ px: 1 }}>
            {grouped.upcoming.length > 0 ? grouped.upcoming.map(renderHearingItem) : (
              <Typography variant="caption" color="text.disabled" sx={{ px: 2, py: 1, display: 'block' }}>{MESSAGES.NO_HEARINGS_WEEK}</Typography>
            )}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UpcomingHearingsCard;
