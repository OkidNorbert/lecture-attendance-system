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
  Avatar,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Book as BookIcon,
  Group as GroupIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from '../../utils/axios';
import { Link } from 'react-router-dom';

// Import sub-components
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import AttendanceMonitoring from './AttendanceMonitoring';
import Reports from './Reports';
import DepartmentManagement from './DepartmentManagement';
import FacultyManagement from './FacultyManagement';
import ProgramManagement from './ProgramManagement';
import SystemOverview from './SystemOverview';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/admin/dashboard-stats');

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
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear(); // Clear all local storage
    window.location.href = '/'; // Redirect to home page
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const tabItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, component: <SystemOverview stats={stats} /> },
    { label: 'Users', icon: <PeopleIcon />, component: <UserManagement /> },
    { label: 'Faculties', icon: <BusinessIcon />, component: <FacultyManagement /> },
    { label: 'Departments', icon: <BusinessIcon />, component: <DepartmentManagement /> },
    { label: 'Programs', icon: <SchoolIcon />, component: <ProgramManagement /> },
    { label: 'Courses', icon: <BookIcon />, component: <CourseManagement /> },
    { label: 'Attendance', icon: <AssessmentIcon />, component: <AttendanceMonitoring /> },
    { label: 'Reports', icon: <BarChartIcon />, component: <Reports /> },
  ];

  const drawer = (
        <Box>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        color: 'white' 
      }}>
        <Avatar 
          sx={{ 
            width: 80, 
            height: 80, 
            mb: 2, 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <DashboardIcon fontSize="large" />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Admin Portal</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Attendance Management System</Typography>
      </Box>
      <Divider />
      <List>
        {tabItems.map((item, index) => (
          <ListItem 
            button 
            key={index} 
            selected={activeTab === index}
            onClick={(e) => handleTabChange(e, index)}
            sx={{ 
              borderLeft: activeTab === index ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === index ? 'rgba(106, 17, 203, 0.1)' : 'transparent'
            }}
            aria-label={item.label}
          >
            <ListItemIcon sx={{ color: activeTab === index ? '#6a11cb' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
          fullWidth
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          sx={{ 
            mt: 2,
            background: 'linear-gradient(45deg, #FF416C 30%, #FF4B2B 90%)',
            boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
          }}
          >
            Logout
          </Button>
        </Box>
      </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fb' }}>
      {/* Responsive drawer */}
      <Box
        component="nav"
        sx={{ width: { md: 280 }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              width: 280, 
              boxSizing: 'border-box', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              borderRight: 'none'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, width: { xs: '100%', md: `calc(100% - 280px)` }, p: 3 }}>
        {/* App Bar */}
        <AppBar 
          position="static" 
          color="transparent" 
          elevation={0}
          sx={{ mb: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {tabItems[activeTab].label} Dashboard
            </Typography>

            <IconButton color="primary" onClick={handleRefreshStats} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
            sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress sx={{ color: '#6a11cb' }} />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4,
                  height: '100%',
                  background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                  color: 'white',
                  boxShadow: '0 10px 20px rgba(106, 17, 203, 0.2)',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2 }}>
                    <PeopleIcon />
                  </Avatar>
              <Typography variant="h6">Total Users</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{stats.totalUsers}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                  Registered in the system
                </Typography>
                <Box sx={{ mt: 2, height: 4, bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2 }}>
                  <Box 
                    sx={{ 
                      height: '100%', 
                      width: `${Math.min(100, stats.totalUsers/2)}%`, 
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: 2
                    }} 
                  />
                </Box>
            </Paper>
          </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4,
                  height: '100%',
                  background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
                  color: 'white',
                  boxShadow: '0 10px 20px rgba(255, 65, 108, 0.2)',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2 }}>
                    <SchoolIcon />
                  </Avatar>
              <Typography variant="h6">Total Courses</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{stats.totalCourses}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                  Available in the catalog
                </Typography>
                <Box sx={{ mt: 2, height: 4, bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2 }}>
                  <Box 
                    sx={{ 
                      height: '100%', 
                      width: `${Math.min(100, stats.totalCourses/2)}%`, 
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: 2
                    }} 
                  />
                </Box>
            </Paper>
          </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4,
                  height: '100%',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  boxShadow: '0 10px 20px rgba(17, 153, 142, 0.2)',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2 }}>
                    <AssessmentIcon />
                  </Avatar>
              <Typography variant="h6">Active Sessions</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{stats.activeAttendance}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                  Currently in progress
                </Typography>
                <Box sx={{ mt: 2, height: 4, bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2 }}>
                  <Box 
                    sx={{ 
                      height: '100%', 
                      width: `${Math.min(100, stats.activeAttendance*10)}%`, 
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: 2
                    }} 
                  />
                </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

        {/* Main Content */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 4, 
            bgcolor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            minHeight: '60vh'
          }}
        >
          {tabItems[activeTab].component}
        </Paper>
      </Box>
        </Box>
  );
};

export default AdminDashboard; 