import React, { useEffect } from 'react';
import AdminDashboardComponent from '../components/admin/AdminDashboard';
import { Box } from '@mui/material';

const AdminDashboard = () => {
  // Add a style reset effect to prevent blank spaces
  useEffect(() => {
    // Override the default Vite/React styling
    document.documentElement.style.backgroundColor = '#f5f7fb';
    document.body.style.backgroundColor = '#f5f7fb';
    document.documentElement.style.margin = '0';
    document.body.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.padding = '0';
    document.documentElement.style.width = '100%';
    document.body.style.width = '100%';
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    
    document.querySelector('#root').style.margin = '0';
    document.querySelector('#root').style.padding = '0';
    document.querySelector('#root').style.maxWidth = '100%';
    document.querySelector('#root').style.width = '100%';
    
    // Cleanup function
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      document.documentElement.style.margin = '';
      document.body.style.margin = '';
      document.documentElement.style.padding = '';
      document.body.style.padding = '';
      document.documentElement.style.width = '';
      document.body.style.width = '';
      document.documentElement.style.overflowX = '';
      document.body.style.overflowX = '';
      
      document.querySelector('#root').style.margin = '';
      document.querySelector('#root').style.padding = '';
      document.querySelector('#root').style.maxWidth = '';
      document.querySelector('#root').style.width = '';
    };
  }, []);

  return (
    <Box 
      sx={{ 
        width: '100%', 
        maxWidth: '100%', 
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
      className="admin-dashboard-container"
    >
      <AdminDashboardComponent />
    </Box>
  );
};

export default AdminDashboard; 