import React, { useState } from 'react';
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
  CssBaseline
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
            onClick={() => setSelectedComponent(item.component)}
            selected={selectedComponent === item.component}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Container maxWidth="lg">
          {renderComponent()}
        </Container>
      </Box>
    </Box>
  );
};

export default Admin; 