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
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HearingsApi } from '../services/api';

const UpcomingHearingsCard = () => {
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
    const nextWeekStr = formatDate(nextWeek);

    return {
      today: hearings.filter((h) => h.hearingDate === todayStr),
      tomorrow: hearings.filter((h) => h.hearingDate === tomorrowStr),
      upcoming: hearings.filter((h) => h.hearingDate > tomorrowStr && h.hearingDate <= nextWeekStr),
    };
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CircularProgress size={24} />
      </Card>
    );
  }

  const grouped = getGroupedHearings();

  const renderHearingItem = (h, index) => (
    <ListItem key={`${h.hearingDate}-${index}`} sx={{ px: 0, py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.2 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            color: 'text.primary', 
            flexGrow: 1,
            cursor: 'pointer',
            '&:hover': { color: 'primary.main' }
          }}
          onClick={() => navigate(`/cases/${h.caseId}`)}
        >
          {h.caseTitle}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
          {new Date(h.hearingDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
         <Typography variant="caption" color="text.secondary">
          {h.court}
        </Typography>
        <Typography variant="caption" color="text.disabled">•</Typography>
        <Typography variant="caption" color="text.secondary">
          {h.advocateName}
        </Typography>
      </Stack>
    </ListItem>
  );

  const SectionLabel = ({ text, color }) => (
    <Typography variant="caption" sx={{ fontWeight: 900, color: color, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem', mb: 1, display: 'block' }}>
      {text}
    </Typography>
  );

  return (
    <Card sx={{ 
      height: '100%', 
      boxShadow: 'none', 
      borderRadius: 4,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 700 }}>
          Hearing Calendar
        </Typography>

        <Box>
          <SectionLabel text="Today" color="primary.main" />
          <List dense sx={{ pt: 0, pb: 1 }}>
            {grouped.today.length > 0 ? (
              grouped.today.map(renderHearingItem)
            ) : (
              <Typography variant="caption" color="text.disabled" sx={{ py: 1, display: 'block' }}>
                No events scheduled
              </Typography>
            )}
          </List>

          <Divider sx={{ my: 1.5, opacity: 0.1 }} />

          <SectionLabel text="Tomorrow" color="#6366f1" />
          <List dense sx={{ pt: 0, pb: 1 }}>
            {grouped.tomorrow.length > 0 ? (
              grouped.tomorrow.map(renderHearingItem)
            ) : (
              <Typography variant="caption" color="text.disabled" sx={{ py: 1, display: 'block' }}>
                No events scheduled
              </Typography>
            )}
          </List>

          <Divider sx={{ my: 1.5, opacity: 0.1 }} />

          <SectionLabel text="Next 7 Days" color="text.secondary" />
          <List dense sx={{ pt: 0 }}>
            {grouped.upcoming.length > 0 ? (
              grouped.upcoming.map(renderHearingItem)
            ) : (
              <Typography variant="caption" color="text.disabled" sx={{ py: 1, display: 'block' }}>
                Nothing scheduled
              </Typography>
            )}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UpcomingHearingsCard;
