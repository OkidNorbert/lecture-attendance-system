import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Tab,
  Tabs,
  IconButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

// Import sub-components
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import AttendanceMonitoring from './AttendanceMonitoring';
import Reports from './Reports';
import DepartmentManagement from './DepartmentManagement';
import FacultyManagement from './FacultyManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeAttendance: 0,
  });

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
          <Tab label="Faculties" icon={<BusinessIcon />} />
          <Tab label="Departments" icon={<BusinessIcon />} />
          <Tab label="User Management" icon={<PeopleIcon />} />
          <Tab label="Course Management" icon={<SchoolIcon />} />
          <Tab label="Attendance" icon={<AssessmentIcon />} />
          <Tab label="Reports" icon={<AssessmentIcon />} />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <FacultyManagement />}
          {activeTab === 1 && <DepartmentManagement />}
          {activeTab === 2 && <UserManagement />}
          {activeTab === 3 && <CourseManagement />}
          {activeTab === 4 && <AttendanceMonitoring />}
          {activeTab === 5 && <Reports />}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard; 