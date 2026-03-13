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
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ReportsApi } from '../services/api';

// Premium Color Palette
const COLORS = [
  '#4f46e5', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      }}>
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: 'text.secondary' }}>
          {label || payload[0].name}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {payload[0].value} {payload[0].name === 'cases' ? 'Cases' : ''}
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, groupRes, trendRes] = await Promise.all([
          ReportsApi.casesByStatus(),
          ReportsApi.casesByGroup(),
          ReportsApi.caseTrends()
        ]);
        
        // Define all categories/statuses to ensure they appear even with 0 counts
        const ALL_STATUSES = ['Open', 'In Progress', 'Disposed', 'Closed'];
        const ALL_CATEGORIES = ['Civil', 'Criminal', 'Consumer', 'Family', 'Writ', 'Other'];

        const sData = ALL_STATUSES.map(s => {
          const found = statusRes.data.find(item => item.status === s);
          return { name: s, value: found ? found.count : 0 };
        });
        setStatusData(sData.filter(s => s.value > 0 || ['Open', 'In Progress', 'Disposed', 'Closed'].includes(s.name)));
        
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
  }, []);

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
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid',
    borderColor: alpha(theme.palette.divider, 0.1),
    borderRadius: 6,
    bgcolor: 'background.paper',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }
  };

  return (
    <Stack spacing={4}>
      <Grid container spacing={3}>
        {/* Case Distribution - Donut Chart */}
        <Grid item xs={12} md={5}>
          <Card sx={cardStyle}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                  Case Distribution
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  By current lifecycle status
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1, width: '100%', minHeight: '300px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={85}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Content for Donut */}
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>
                    {statusData.reduce((acc, curr) => acc + curr.value, 0)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={2} sx={{ mt: 2 }}>
                {statusData.map((entry, index) => (
                  <Stack key={entry.name} direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {entry.name}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Case Analytics - Refined Bar Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={cardStyle}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                  Case Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Distribution by legal categories
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, width: '100%', minHeight: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={groupData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={alpha(theme.palette.divider, 0.05)} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      axisLine={false} 
                      tickLine={false} 
                      style={{ fontSize: '12px', fontWeight: 600, fill: theme.palette.text.secondary }} 
                    />
                    <Tooltip cursor={{ fill: alpha(theme.palette.divider, 0.05) }} content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill={theme.palette.primary.main} 
                      radius={[0, 6, 6, 0]} 
                      barSize={16}
                      animationDuration={1500}
                    >
                      {groupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={alpha(theme.palette.primary.main, 1 - (index * 0.15))} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Registration Growth - Gradient Area Chart */}
      <Card sx={cardStyle}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              Registration Growth
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New cases over time (6-month view)
            </Typography>
          </Box>

          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke={alpha(theme.palette.divider, 0.05)} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: theme.palette.text.disabled, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: theme.palette.text.disabled, fontWeight: 600 }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cases" 
                  stroke={theme.palette.primary.main} 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCases)" 
                  animationDuration={2000}
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
