import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  CircularProgress,
  Stack,
  alpha
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ReportsApi } from '../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5, color: 'text.secondary', textTransform: 'uppercase' }}>
          {label || payload[0].name}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
          {payload[0].value} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>units</span>
        </Typography>
      </Box>
    );
  }
  return null;
};

const DashboardCharts = () => {
  const theme = useTheme();
  const [statusData, setStatusData] = useState([]);
  const [groupData, setGroupData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  const THEME_COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, groupRes, trendRes] = await Promise.all([
          ReportsApi.casesByStatus(),
          ReportsApi.casesByGroup(),
          ReportsApi.caseTrends()
        ]);
        
        const ALL_STATUSES = ['Open', 'In Progress', 'Disposed', 'Closed'];
        const ALL_CATEGORIES = ['Civil', 'Criminal', 'Consumer', 'Family', 'Writ', 'Other'];

        const sData = ALL_STATUSES.map(s => {
          const found = statusRes.data.find(item => item.status === s);
          return { name: s, value: found ? found.count : 0 };
        });
        setStatusData(sData);
        
        const gData = ALL_CATEGORIES.map(cat => {
          const found = groupRes.data.find(item => item.group === cat);
          return { name: cat, count: found ? found.count : 0 };
        });
        setGroupData(gData);

        setTrendData(trendRes.data.map(item => ({
          name: item.month,
          cases: item.count
        })));
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [theme]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={24} thickness={5} />
      </Box>
    );
  }

  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'none',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 6,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.04)}`
    }
  };

  return (
    <Stack spacing={4}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Matters Lifecycle</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Status-wise case segmentation</Typography>
              
              <Box sx={{ width: '100%', height: 320, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={105}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} cornerRadius={8} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                <Box sx={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none'
                }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>
                    {statusData.reduce((acc, curr) => acc + curr.value, 0)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase' }}>
                    Files
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={3} sx={{ mt: 3 }}>
                {statusData.map((entry, index) => (
                  <Stack key={entry.name} direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: THEME_COLORS[index % THEME_COLORS.length] }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{entry.name}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Legal Categories</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Group-wise distribution of claims</Typography>

              <Box sx={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="5 5" horizontal={false} stroke={alpha(theme.palette.divider, 0.05)} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" type="category" width={90} axisLine={false} tickLine={false} 
                      style={{ fontSize: '11px', fontWeight: 800, fill: theme.palette.text.secondary }} 
                    />
                    <Tooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.02) }} content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
                      {groupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={alpha(theme.palette.primary.main, 1 - (index * 0.1))} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={cardStyle}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Registration Momentum</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Temporal analysis of new case intake</Typography>

          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="firmGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.05)} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.disabled, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: theme.palette.text.disabled, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" dataKey="cases" stroke={theme.palette.primary.main} strokeWidth={4}
                  fill="url(#firmGradient)" animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default DashboardCharts;
