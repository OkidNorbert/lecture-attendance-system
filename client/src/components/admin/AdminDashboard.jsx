import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Import sub-components
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import AttendanceMonitoring from './AttendanceMonitoring';
import Reports from './Reports';
import DepartmentManagement from './DepartmentManagement';
import FacultyManagement from './FacultyManagement';
import ProgramManagement from './ProgramManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(
        err.response?.data?.msg || 
        'Failed to fetch dashboard statistics. Please try again later.'
      );
      // Set default values if fetch fails
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        activeAttendance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Add refresh functionality
  const handleRefreshStats = () => {
    fetchDashboardStats();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLogout = () => {
    localStorage.clear(); // Clear all local storage
    window.location.href = '/'; // Redirect to home page
  };

  return (
    <Container maxWidth="xl">
      {/* Dashboard Header */}
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleRefreshStats}
            sx={{ mr: 2 }}
          >
            Refresh Stats
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
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
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Users" icon={<PeopleIcon />}/>
          <Tab label="Faculties" icon={<BusinessIcon />}/>
          <Tab label="Departments" icon={<BusinessIcon />} />
          <Tab label="Programs" icon={<BusinessIcon />}/>
          <Tab label="Courses" icon={<SchoolIcon />}/>
          <Tab label="Attendance" icon={<AssessmentIcon />} />
          <Tab label="Reports" icon={<AssessmentIcon />} />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <UserManagement />}
          {activeTab === 1 && <FacultyManagement />}
          {activeTab === 2 && <DepartmentManagement />}
          {activeTab === 3 && <ProgramManagement />}
          {activeTab === 4 && <CourseManagement />}
          {activeTab === 5 && <AttendanceMonitoring />}
          {activeTab === 6 && <Reports />}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard; 