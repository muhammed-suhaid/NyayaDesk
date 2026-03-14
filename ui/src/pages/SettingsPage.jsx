import React, { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Card,
  CardContent,
  Stack,
  alpha,
  useTheme
} from '@mui/material';

import CompanySettings from './CompanySettings';
import UserManagement from './UserManagement';
import ClientManagement from './ClientManagement';
import SubscriptionSettings from './SubscriptionSettings';
import { UI_ACTIONS } from '../constants';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`settings-tabpanel-${index}`} aria-labelledby={`settings-tab-${index}`} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 1.5 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Settings</Typography>
          <Typography variant="caption" color="text.secondary">Manage your firm configuration and billing.</Typography>
        </Box>

        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Tabs 
            value={value} 
            onChange={(e, v) => setValue(v)}
            sx={{ 
              px: 1, borderBottom: '1px solid', borderColor: 'divider', minHeight: 40,
              '& .MuiTab-root': { py: 1, minHeight: 40, fontWeight: 800, fontSize: '0.7rem' }
            }}
          >
            <Tab label="Company" />
            <Tab label="Users" />
            <Tab label="Clients" />
            <Tab label="Billing" />
          </Tabs>

          <Box sx={{ p: 2 }}>
            <CustomTabPanel value={value} index={0}>
              <CompanySettings />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
              <UserManagement />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
              <ClientManagement />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={3}>
              <SubscriptionSettings />
            </CustomTabPanel>
          </Box>
        </Card>
      </Stack>
    </Box>
  );
}
