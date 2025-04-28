import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  CssBaseline,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import DepartmentManagement from './DepartmentManagement';
import ProgramManagement from './ProgramManagement';
import AttendanceManagement from './AttendanceManagement';
import ReportsManagement from './ReportsManagement';

const drawerWidth = 240;

const Admin = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState('departments');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isTV = useMediaQuery('(min-width: 1600px)');
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');

  // Adjust drawer width based on screen size
  const responsiveDrawerWidth = isTV ? 300 : isTablet ? 200 : drawerWidth;

  // Close drawer automatically when changing orientation on mobile
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isLandscape, isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const menuItems = [
    { text: 'Departments', icon: <BusinessIcon />, component: 'departments' },
    { text: 'Programs', icon: <SchoolIcon />, component: 'programs' },
    { text: 'Courses', icon: <BookIcon />, component: 'courses' },
    { text: 'Users', icon: <PeopleIcon />, component: 'users' },
    { text: 'Attendance', icon: <AssignmentIcon />, component: 'attendance' },
    { text: 'Reports', icon: <AssessmentIcon />, component: 'reports' }
  ];

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'departments':
        return <DepartmentManagement />;
      case 'programs':
        return <ProgramManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'users':
        return <UserManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'reports':
        return <ReportsManagement />;
      default:
        return <DepartmentManagement />;
    }
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              setSelectedComponent(item.component);
              if (isMobile) setMobileOpen(false);
            }}
            selected={selectedComponent === item.component}
            sx={{
              py: isTV ? 1.5 : 1,
              px: isTV ? 3 : 2
            }}
          >
            <ListItemIcon sx={{
              minWidth: isTV ? 42 : 36
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontSize: isTV ? '1.1rem' : 'inherit',
                fontWeight: selectedComponent === item.component ? 'bold' : 'normal'
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout} sx={{
          py: isTV ? 1.5 : 1,
          px: isTV ? 3 : 2
        }}>
          <ListItemIcon sx={{
            minWidth: isTV ? 42 : 36
          }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{
              fontSize: isTV ? '1.1rem' : 'inherit',
            }}
          />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      '@media (orientation: landscape) and (max-height: 600px)': {
        flexDirection: 'row',
        minHeight: '100vh',
        height: 'auto'
      },
      '@media (min-width: 1600px)': {
        height: '100vh',
      } 
    }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${responsiveDrawerWidth}px)` },
          ml: { sm: `${responsiveDrawerWidth}px` },
          '@media (min-width: 1600px)': {
            height: 70,
          }
        }}
      >
        <Toolbar sx={{
          '@media (min-width: 1600px)': {
            minHeight: 70,
          }
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{
            fontSize: isTV ? '1.5rem' : 'inherit',
          }}>
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { sm: responsiveDrawerWidth }, 
          flexShrink: { sm: 0 },
          '@media (orientation: landscape) and (max-height: 600px)': {
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto'
          }
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: responsiveDrawerWidth,
              '@media (orientation: landscape) and (max-height: 600px)': {
                position: 'absolute',
                height: '100vh',
                overflowY: 'auto'
              }
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: responsiveDrawerWidth,
              '@media (orientation: landscape) and (max-height: 600px)': {
                position: 'relative',
                height: '100vh',
                overflowY: 'auto'
              },
              '@media (min-width: 1600px)': {
                paddingTop: '10px',
              }
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, lg: 4 },
          width: { sm: `calc(100% - ${responsiveDrawerWidth}px)` },
          mt: { xs: 7, sm: 8, lg: 9 },
          '@media (orientation: landscape) and (max-height: 600px)': {
            mt: 4,
            p: 2,
            overflowY: 'auto'
          },
          '@media (min-width: 1600px)': {
            mt: 10,
            p: 4,
          }
        }}
      >
        <Container 
          disableGutters
          sx={{ 
            width: '100%',
            '@media (orientation: landscape) and (max-height: 600px)': {
              p: 0
            }
          }}
        >
          {renderComponent()}
        </Container>
      </Box>
    </Box>
  );
};

export default Admin; 