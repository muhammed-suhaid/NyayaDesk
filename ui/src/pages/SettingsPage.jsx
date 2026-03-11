import React, { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import CompanySettings from './CompanySettings';
import UserManagement from './UserManagement';
import ClientManagement from './ClientManagement';
import SubscriptionSettings from './SubscriptionSettings';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export default function SettingsPage() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="settings tabs">
          <Tab label="Company Details" {...a11yProps(0)} />
          <Tab label="Users" {...a11yProps(1)} />
          <Tab label="Clients" {...a11yProps(2)} />
          <Tab label="Subscription" {...a11yProps(3)} />
        </Tabs>
      </Box>
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
  );
}
