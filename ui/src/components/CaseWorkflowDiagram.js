import React from 'react';
import { Box, Typography, Paper, Stack, useTheme } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const WorkflowStep = ({ title, description, color, active }) => (
  <Paper
    elevation={active ? 4 : 1}
    sx={{
      p: 2,
      minWidth: '160px',
      textAlign: 'center',
      border: '2px solid',
      borderColor: active ? color : 'transparent',
      borderRadius: 4,
      background: active ? `linear-gradient(135deg, ${color}11 0%, ${color}22 100%)` : 'transparent',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: active ? 8 : 4
      }
    }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: active ? color : 'text.secondary', mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
      {description}
    </Typography>
  </Paper>
);

const CaseWorkflowDiagram = () => {
  const theme = useTheme();

  const steps = [
    { title: 'Intake', description: 'Client Registered', color: '#0088FE' },
    { title: 'Processing', description: 'Documents & Detail', color: '#FFBB28' },
    { title: 'In Court', description: 'Hearing Managed', color: '#00C49F' },
    { title: 'Disposal', description: 'Final Outcome', color: '#FF8042' }
  ];

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 800 }}>
        Law Firm Workflow
      </Typography>
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        alignItems="center" 
        justifyContent="space-between"
        spacing={2}
        sx={{ 
          p: 3, 
          borderRadius: 4, 
          bgcolor: 'rgba(0,0,0,0.02)',
          border: '1px dashed rgba(0,0,0,0.1)' 
        }}
      >
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            <WorkflowStep 
              title={step.title} 
              description={step.description} 
              color={step.color}
              active={true}
            />
            {index < steps.length - 1 && (
              <Box sx={{ display: { xs: 'none', md: 'block' }, color: 'text.disabled' }}>
                <ArrowForwardIosIcon fontSize="small" />
              </Box>
            )}
          </React.Fragment>
        ))}
      </Stack>
    </Box>
  );
};

export default CaseWorkflowDiagram;
