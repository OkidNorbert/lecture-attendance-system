import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

// Import sub-components
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import AttendanceMonitoring from './AttendanceMonitoring';
import Reports from './Reports';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeAttendance: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      {/* Dashboard Header */}
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h6">Total Users</Typography>
            <Typography variant="h4">{stats.totalUsers}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
            <Typography variant="h6">Total Courses</Typography>
            <Typography variant="h4">{stats.totalCourses}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 40, color: 'success.main' }} />
            <Typography variant="h6">Active Sessions</Typography>
            <Typography variant="h4">{stats.activeAttendance}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="User Management" icon={<PeopleIcon />} />
          <Tab label="Course Management" icon={<SchoolIcon />} />
          <Tab label="Attendance" icon={<AssessmentIcon />} />
          <Tab label="Reports" icon={<AssessmentIcon />} />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <UserManagement />}
          {activeTab === 1 && <CourseManagement />}
          {activeTab === 2 && <AttendanceMonitoring />}
          {activeTab === 3 && <Reports />}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard; 