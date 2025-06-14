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
  Folder as FolderIcon,
  MenuBook as MenuBookIcon,
  Group as GroupIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  LocalLibrary as LocalLibraryIcon,
} from '@mui/icons-material';
import axios from '../../utils/axios';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Import sub-components
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import AttendanceMonitoring from './AttendanceMonitoring';
import Reports from './Reports';
import DepartmentManagement from './DepartmentManagement';
import FacultyManagement from './FacultyManagement';
import ProgramManagement from './ProgramManagement';
import SystemOverview from './SystemOverview';
import EnrollmentManagement from '../EnrollmentManagement';

// Styled components for responsive layout
const DashboardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  width: '100%',
  minWidth: '100%',
  maxWidth: '100%',
  overflow: 'hidden',
  backgroundColor: '#f5f7fb',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column', // Stack elements vertically on very small screens
    position: 'absolute',
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    flexDirection: 'row', // Force row layout in landscape orientation on small height
    height: 'auto',
    minHeight: '100vh',
  },
  // TV and large screens
  '@media (min-width: 1600px)': {
    maxWidth: '100%',
    width: '100%',
  }
}));

const Sidebar = styled(Box)(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  backgroundColor: 'white',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  zIndex: theme.zIndex.drawer,
  overflowY: 'auto', // Allow scrolling within sidebar
  [theme.breakpoints.down('md')]: {
    width: 0,
    position: 'fixed',
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    '&.open': {
      width: 280,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    height: 'auto',
    maxHeight: '50vh',
    position: 'relative',
    '&.open': {
      width: '100%',
      maxHeight: '60vh',
    },
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    maxWidth: 280,
    maxHeight: 'none',
    height: 'auto',
    minHeight: '100vh',
    overflowY: 'auto',
    position: 'sticky',
    top: 0,
    '&.open': {
      width: 280,
      maxHeight: 'none',
    }
  },
  // TV and large screens
  '@media (min-width: 1600px)': {
    width: 320,
    '&.open': {
      width: 320,
    }
  }
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(3),
  backgroundColor: '#f5f7fb',
  height: '100vh',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    width: '100%',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    height: 'auto',
    minHeight: '50vh',
    width: '100%',
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    height: 'auto',
    minHeight: '100vh',
    padding: theme.spacing(1, 2),
    width: '100%',
  },
  // TV and large screens
  '@media (min-width: 1600px)': {
    padding: theme.spacing(4),
    width: '100%',
  }
}));

const AdminDashboard = () => {
  // Add a style reset effect to prevent blank spaces
  useEffect(() => {
    // Add background color to html and body
    document.documentElement.style.backgroundColor = '#f5f7fb';
    document.body.style.backgroundColor = '#f5f7fb';
    document.documentElement.style.margin = '0';
    document.body.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.padding = '0';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.width = '100%';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    // Fix for blank space when zooming
    document.querySelector('#root').style.width = '100%';
    document.querySelector('#root').style.maxWidth = '100%';
    document.querySelector('#root').style.margin = '0';
    document.querySelector('#root').style.padding = '0';
    document.querySelector('#root').style.overflow = 'hidden';
    
    // Cleanup function
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      document.documentElement.style.margin = '';
      document.body.style.margin = '';
      document.documentElement.style.padding = '';
      document.body.style.padding = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.documentElement.style.width = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      
      document.querySelector('#root').style.width = '';
      document.querySelector('#root').style.maxWidth = '';
      document.querySelector('#root').style.margin = '';
      document.querySelector('#root').style.padding = '';
      document.querySelector('#root').style.overflow = '';
    };
  }, []);

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
    { label: 'Enrollments', icon: <AssignmentIcon />, component: <EnrollmentManagement /> },
    { label: 'Attendance', icon: <AssessmentIcon />, component: <AttendanceMonitoring /> },
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
            component="div"
            disablePadding
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
    <DashboardContainer>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ 
          width: '100%', 
          zIndex: (theme) => theme.zIndex.drawer + 2 
        }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Admin Dashboard
            </Typography>
            <IconButton
              color="inherit"
              aria-label="refresh data"
              onClick={handleRefreshStats}
            >
              <RefreshIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Sidebar className={mobileOpen ? 'open' : ''}>
        {isMobile && (
          <Box sx={{ height: (theme) => theme.mixins.toolbar.minHeight }} />
        )}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          color: 'white',
          mb: 2,
          '@media (min-width: 1600px)': {
            p: 3,
          }
        }}>
          <Avatar 
            sx={{ 
              width: 70, 
              height: 70, 
              mb: 2, 
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '@media (min-width: 1600px)': {
                width: 100,
                height: 100,
                mb: 3,
              }
            }}
          >
            <DashboardIcon fontSize="large" />
          </Avatar>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            '@media (min-width: 1600px)': {
              fontSize: '1.5rem',
            }
          }}>Admin Portal</Typography>
          <Typography variant="body2" sx={{ 
            opacity: 0.8,
            '@media (min-width: 1600px)': {
              fontSize: '1rem',
            }
          }}>Attendance System</Typography>
        </Box>
        <Divider />
        <List sx={{ px: 1 }}>
          <ListItem 
            component="div"
            disablePadding
            selected={activeTab === 0} 
            onClick={(e) => handleTabChange(e, 0)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              borderLeft: activeTab === 0 ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === 0 ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(106, 17, 203, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activeTab === 0 ? '#6a11cb' : 'rgba(0, 0, 0, 0.6)'}}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText 
              primary="System Overview" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 0 ? 'bold' : 'regular',
                color: activeTab === 0 ? '#6a11cb' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem'
              }}
            />
          </ListItem>
          <ListItem 
            component="div"
            disablePadding
            selected={activeTab === 1} 
            onClick={(e) => handleTabChange(e, 1)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              borderLeft: activeTab === 1 ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === 1 ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(106, 17, 203, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activeTab === 1 ? '#6a11cb' : 'rgba(0, 0, 0, 0.6)' }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="User Management" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 1 ? 'bold' : 'regular',
                color: activeTab === 1 ? '#6a11cb' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem'
              }}
            />
          </ListItem>
          <ListItem 
            component="div"
            disablePadding
            selected={activeTab === 2} 
            onClick={(e) => handleTabChange(e, 2)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              borderLeft: activeTab === 2 ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === 2 ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(106, 17, 203, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activeTab === 2 ? '#6a11cb' : 'rgba(0, 0, 0, 0.6)' }}>
              <BusinessIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Faculty Management" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 2 ? 'bold' : 'regular',
                color: activeTab === 2 ? '#6a11cb' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem'
              }}
            />
          </ListItem>
          <ListItem 
            component="div"
            disablePadding
            selected={activeTab === 3} 
            onClick={(e) => handleTabChange(e, 3)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              borderLeft: activeTab === 3 ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === 3 ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(106, 17, 203, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activeTab === 3 ? '#6a11cb' : 'rgba(0, 0, 0, 0.6)' }}>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Department Management" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 3 ? 'bold' : 'regular',
                color: activeTab === 3 ? '#6a11cb' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem'
              }}
            />
          </ListItem>
          <ListItem 
            component="div"
            disablePadding
            selected={activeTab === 4} 
            onClick={(e) => handleTabChange(e, 4)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              borderLeft: activeTab === 4 ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === 4 ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(106, 17, 203, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activeTab === 4 ? '#6a11cb' : 'rgba(0, 0, 0, 0.6)' }}>
              <SchoolIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Program Management" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 4 ? 'bold' : 'regular',
                color: activeTab === 4 ? '#6a11cb' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem'
              }}
            />
          </ListItem>
          <ListItem 
            component="div"
            disablePadding
            selected={activeTab === 5} 
            onClick={(e) => handleTabChange(e, 5)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              borderLeft: activeTab === 5 ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === 5 ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(106, 17, 203, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activeTab === 5 ? '#6a11cb' : 'rgba(0, 0, 0, 0.6)' }}>
              <MenuBookIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Course Management" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 5 ? 'bold' : 'regular',
                color: activeTab === 5 ? '#6a11cb' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem'
              }}
            />
          </ListItem>
          <ListItem 
            component="div"
            disablePadding
            selected={activeTab === 6} 
            onClick={(e) => handleTabChange(e, 6)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              borderLeft: activeTab === 6 ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === 6 ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(106, 17, 203, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activeTab === 6 ? '#6a11cb' : 'rgba(0, 0, 0, 0.6)' }}>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Enrollment Management" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 6 ? 'bold' : 'regular',
                color: activeTab === 6 ? '#6a11cb' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem'
              }}
            />
          </ListItem>
          <ListItem 
            component="div"
            disablePadding
            selected={activeTab === 7} 
            onClick={(e) => handleTabChange(e, 7)}
            sx={{ 
              mb: 1, 
              borderRadius: 1,
              borderLeft: activeTab === 7 ? '4px solid #6a11cb' : '4px solid transparent',
              bgcolor: activeTab === 7 ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(106, 17, 203, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activeTab === 7 ? '#6a11cb' : 'rgba(0, 0, 0, 0.6)' }}>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Attendance Monitoring" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 7 ? 'bold' : 'regular',
                color: activeTab === 7 ? '#6a11cb' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem'
              }}
            />
          </ListItem>
        </List>
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              mt: 2,
              py: 1,
              background: 'linear-gradient(45deg, #FF416C 30%, #FF4B2B 90%)',
              boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF416C 10%, #FF4B2B 70%)',
                boxShadow: '0 5px 10px 2px rgba(255, 105, 135, .4)',
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Sidebar>

      {/* Content Area */}
      <ContentArea>
        {isMobile && (
          <Box sx={{ 
            height: (theme) => theme.mixins.toolbar.minHeight,
            mb: 2 
          }} />
        )}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            borderRadius: 2, 
            bgcolor: 'white',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            minHeight: { xs: '70vh', sm: '75vh', md: '85vh' },
            height: '100%',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            '@media (min-width: 1600px)': {
              p: 4,
              borderRadius: 3,
            }
          }}
        >
          {tabItems[activeTab].component}
        </Paper>
      </ContentArea>
    </DashboardContainer>
  );
};

export default AdminDashboard; 