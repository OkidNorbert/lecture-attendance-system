import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  IconButton,
  Grid,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Book as BookIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Alarm as AlarmIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import axios from '../../utils/axios';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SystemOverview = ({ stats }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemData, setSystemData] = useState({
    users: { total: 0, students: 0, lecturers: 0, admins: 0 },
    courses: { total: 0, active: 0, inactive: 0 },
    faculties: { total: 0 },
    departments: { total: 0 },
    programs: { total: 0 },
    attendance: { total: 0, today: 0, present: 0, absent: 0 },
    recentSessions: [],
    upcomingEvents: []
  });

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch users by role
      const usersPromise = axios.get('/api/admin/users');
      // Fetch faculties
      const facultiesPromise = axios.get('/api/admin/faculties');
      // Fetch departments
      const departmentsPromise = axios.get('/api/admin/departments');
      // Fetch programs
      const programsPromise = axios.get('/api/admin/programs');
      // Fetch courses
      const coursesPromise = axios.get('/api/admin/courses');
      // Fetch attendance records
      const attendancePromise = axios.get('/api/admin/attendance');
      // Fetch recent attendance sessions
      const sessionsPromise = axios.get('/api/admin/sessions');

      // Wait for all promises to resolve
      const [
        usersResponse,
        facultiesResponse,
        departmentsResponse,
        programsResponse,
        coursesResponse,
        attendanceResponse,
        sessionsResponse
      ] = await Promise.all([
        usersPromise,
        facultiesPromise,
        departmentsPromise,
        programsPromise,
        coursesPromise,
        attendancePromise,
        sessionsPromise
      ]);

      // Process users data
      const users = usersResponse.data;
      const students = users.filter(user => user.role === 'student').length;
      const lecturers = users.filter(user => user.role === 'lecturer').length;
      const admins = users.filter(user => user.role === 'admin').length;

      // Process attendance data
      const attendance = attendanceResponse.data;
      const today = new Date().toISOString().slice(0, 10);
      const todayAttendance = attendance.filter(record => 
        new Date(record.date).toISOString().slice(0, 10) === today
      ).length;
      const presentCount = attendance.filter(record => record.status === 'present').length;
      const absentCount = attendance.filter(record => record.status === 'absent').length;

      // Process course data
      const courses = coursesResponse.data;
      const activeCourses = courses.filter(course => course.status === 'active').length;
      const inactiveCourses = courses.filter(course => course.status !== 'active').length;

      // Compile system data
      setSystemData({
        users: { 
          total: users.length, 
          students, 
          lecturers, 
          admins 
        },
        courses: { 
          total: courses.length, 
          active: activeCourses, 
          inactive: inactiveCourses 
        },
        faculties: { 
          total: facultiesResponse.data.length 
        },
        departments: { 
          total: departmentsResponse.data.length 
        },
        programs: { 
          total: programsResponse.data.length 
        },
        attendance: { 
          total: attendance.length, 
          today: todayAttendance, 
          present: presentCount, 
          absent: absentCount 
        },
        recentSessions: sessionsResponse.data.slice(0, 5),
        upcomingEvents: [] // Would be populated if we had scheduled events
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching system data:', err);
      setError(err.response?.data?.msg || 'Failed to fetch system overview data');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSystemData();
  };

  // Prepare chart data
  const userDistributionData = [
    { name: 'Students', value: systemData.users.students },
    { name: 'Lecturers', value: systemData.users.lecturers },
    { name: 'Admins', value: systemData.users.admins },
  ];

  const attendanceStatusData = [
    { name: 'Present', value: systemData.attendance.present },
    { name: 'Absent', value: systemData.attendance.absent },
  ];

  // Course distribution
  const courseData = [
    { name: 'Active', value: systemData.courses.active },
    { name: 'Inactive', value: systemData.courses.inactive },
  ];

  // Dummy attendance trend data (replace with real data when available)
  const attendanceTrendData = [
    { name: 'Mon', present: 45, absent: 8 },
    { name: 'Tue', present: 50, absent: 5 },
    { name: 'Wed', present: 40, absent: 10 },
    { name: 'Thu', present: 55, absent: 3 },
    { name: 'Fri', present: 48, absent: 7 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>System Overview</Typography>
        <Button
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          variant="outlined"
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} sx={{ 
          '@media (orientation: landscape) and (max-height: 500px)': { 
            maxWidth: '50%' 
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            borderRadius: 3, 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            '@media (orientation: landscape) and (max-height: 500px)': {
              display: 'flex',
              alignItems: 'center',
              textAlign: 'left',
              p: 1.5
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 1,
              '@media (orientation: landscape) and (max-height: 500px)': {
                mb: 0,
                mr: 2,
                minWidth: 'fit-content'
              }
            }}>
              <Avatar sx={{ 
                bgcolor: '#0088FE', 
                width: 56, 
                height: 56,
                '@media (orientation: landscape) and (max-height: 500px)': {
                  width: 40,
                  height: 40
                }
              }}>
                <PeopleIcon />
              </Avatar>
            </Box>
            <Box sx={{
              '@media (orientation: landscape) and (max-height: 500px)': {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold',
                '@media (orientation: landscape) and (max-height: 500px)': {
                  fontSize: '1.5rem'
                }
              }}>
              {systemData.users.total}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Total Users
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {systemData.users.students} Students • {systemData.users.lecturers} Lecturers • {systemData.users.admins} Admins
            </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3} sx={{ 
          '@media (orientation: landscape) and (max-height: 500px)': { 
            maxWidth: '50%' 
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            borderRadius: 3, 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            '@media (orientation: landscape) and (max-height: 500px)': {
              display: 'flex',
              alignItems: 'center',
              textAlign: 'left',
              p: 1.5
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 1,
              '@media (orientation: landscape) and (max-height: 500px)': {
                mb: 0,
                mr: 2,
                minWidth: 'fit-content'
              }
            }}>
              <Avatar sx={{ 
                bgcolor: '#00C49F', 
                width: 56, 
                height: 56,
                '@media (orientation: landscape) and (max-height: 500px)': {
                  width: 40,
                  height: 40
                }
              }}>
                <BookIcon />
              </Avatar>
            </Box>
            <Box sx={{
              '@media (orientation: landscape) and (max-height: 500px)': {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold',
                '@media (orientation: landscape) and (max-height: 500px)': {
                  fontSize: '1.5rem'
                }
              }}>
              {systemData.courses.total}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Courses
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {systemData.courses.active} Active • {systemData.courses.inactive} Inactive
            </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3} sx={{ 
          '@media (orientation: landscape) and (max-height: 500px)': { 
            maxWidth: '50%' 
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            borderRadius: 3, 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            '@media (orientation: landscape) and (max-height: 500px)': {
              display: 'flex',
              alignItems: 'center',
              textAlign: 'left',
              p: 1.5
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 1,
              '@media (orientation: landscape) and (max-height: 500px)': {
                mb: 0,
                mr: 2,
                minWidth: 'fit-content'
              }
            }}>
              <Avatar sx={{ 
                bgcolor: '#FFBB28', 
                width: 56, 
                height: 56,
                '@media (orientation: landscape) and (max-height: 500px)': {
                  width: 40,
                  height: 40
                }
              }}>
                <CheckCircleIcon />
              </Avatar>
            </Box>
            <Box sx={{
              '@media (orientation: landscape) and (max-height: 500px)': {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold',
                '@media (orientation: landscape) and (max-height: 500px)': {
                  fontSize: '1.5rem'
                }
              }}>
              {systemData.attendance.total}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Attendance Records
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {systemData.attendance.today} Today • {systemData.attendance.present} Present • {systemData.attendance.absent} Absent
            </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3} sx={{ 
          '@media (orientation: landscape) and (max-height: 500px)': { 
            maxWidth: '50%' 
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            borderRadius: 3, 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            '@media (orientation: landscape) and (max-height: 500px)': {
              display: 'flex',
              alignItems: 'center',
              textAlign: 'left',
              p: 1.5
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 1,
              '@media (orientation: landscape) and (max-height: 500px)': {
                mb: 0,
                mr: 2,
                minWidth: 'fit-content'
              }
            }}>
              <Avatar sx={{ 
                bgcolor: '#FF8042', 
                width: 56, 
                height: 56,
                '@media (orientation: landscape) and (max-height: 500px)': {
                  width: 40,
                  height: 40
                }
              }}>
                <BusinessIcon />
              </Avatar>
            </Box>
            <Box sx={{
              '@media (orientation: landscape) and (max-height: 500px)': {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold',
                '@media (orientation: landscape) and (max-height: 500px)': {
                  fontSize: '1.5rem'
                }
              }}>
              {systemData.faculties.total}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Faculties
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {systemData.departments.total} Departments • {systemData.programs.total} Programs
            </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts and Data Visualization */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* User Distribution */}
        <Grid item xs={12} md={4} sx={{ 
          '@media (orientation: landscape) and (max-height: 600px)': { 
            maxWidth: '33.33%' 
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            height: { xs: 250, sm: 300 },
            borderRadius: 3, 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
            overflow: 'hidden',
            '@media (orientation: landscape) and (max-height: 600px)': {
              height: 200
            }
          }}>
            <Typography variant="h6" gutterBottom>User Distribution</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={({ x, y, cx, cy }) => Math.min(cx, cy) * 0.7}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Attendance Trends */}
        <Grid item xs={12} md={8} sx={{ 
          '@media (orientation: landscape) and (max-height: 600px)': { 
            maxWidth: '66.66%' 
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            height: { xs: 250, sm: 300 },
            borderRadius: 3, 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
            overflow: 'hidden',
            '@media (orientation: landscape) and (max-height: 600px)': {
              height: 200
            }
          }}>
            <Typography variant="h6" gutterBottom>Weekly Attendance Trends</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart
                data={attendanceTrendData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#00C49F" name="Present" />
                <Bar dataKey="absent" fill="#FF8042" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activities and Quick Links */}
      <Grid container spacing={3} sx={{ 
        '@media (orientation: landscape) and (max-height: 600px)': { 
          maxWidth: '66.66%' 
        }
      }}>
        {/* Program-Course Management Section - NEW FEATURE */}
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" gutterBottom>Program and Course Relationships</Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Academic Structure</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(106, 17, 203, 0.05)', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#6a11cb', mr: 1, width: 32, height: 32 }}>
                        <BusinessIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {systemData.faculties.total} Faculties
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      The highest organizational unit containing departments
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      onClick={(e) => {
                        e.preventDefault();
                        document.querySelector('[aria-label="Faculties"]')?.click();
                      }}
                    >
                      Manage Faculties
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(0, 196, 159, 0.05)', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#00C49F', mr: 1, width: 32, height: 32 }}>
                        <FolderIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {systemData.departments.total} Departments
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      Academic units within faculties that manage programs
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      onClick={(e) => {
                        e.preventDefault();
                        document.querySelector('[aria-label="Departments"]')?.click();
                      }}
                    >
                      Manage Departments
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255, 187, 40, 0.05)', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#FFBB28', mr: 1, width: 32, height: 32 }}>
                        <SchoolIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {systemData.programs.total} Programs
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      Degree programs that contain courses and enroll students
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      onClick={(e) => {
                        e.preventDefault();
                        document.querySelector('[aria-label="Programs"]')?.click();
                      }}
                    >
                      Manage Programs
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Course and Student Distribution
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Based on your ER diagram, you can enhance the system by adding direct course-student enrollments, 
                program-specific reporting, and department-level analytics.
              </Alert>
              <Button 
                variant="contained" 
                color="primary"
                sx={{ mr: 1 }}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('[aria-label="Courses"]')?.click();
                }}
              >
                Manage Courses
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('[aria-label="Users"]')?.click();
                }}
              >
                Manage Students
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Attendance Sessions */}
        <Grid item xs={12} md={6} sx={{ 
          '@media (orientation: landscape) and (max-height: 600px)': { 
            maxWidth: '50%' 
          }
        }}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" gutterBottom>Recent Attendance Sessions</Typography>
            {systemData.recentSessions.length > 0 ? (
              <List>
                {systemData.recentSessions.map((session, index) => (
                  <React.Fragment key={session._id || index}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: '#0088FE' }}>
                          <AssignmentIcon />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={session.courseId?.name || 'Unknown Course'}
                        secondary={`Created by: ${session.lecturerId?.name || 'Unknown'} • ${new Date(session.createdAt).toLocaleString()}`}
                      />
                      <Chip 
                        label={session.status} 
                        size="small" 
                        color={session.status === 'active' ? 'success' : 'default'} 
                      />
                    </ListItem>
                    {index < systemData.recentSessions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No recent sessions found
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick Access */}
        <Grid item xs={12} md={6} sx={{ 
          '@media (orientation: landscape) and (max-height: 600px)': { 
            maxWidth: '50%' 
          }
        }}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" gutterBottom>Quick Access</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  component={Link}
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector('[aria-label="Users"]')?.click();
                  }}
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{ p: 2, justifyContent: 'flex-start' }}
                  endIcon={<ArrowForwardIcon />}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1">Manage Users</Typography>
                    <Typography variant="body2" color="textSecondary">{systemData.users.total} Users</Typography>
                  </Box>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  component={Link}
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector('[aria-label="Courses"]')?.click();
                  }}
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{ p: 2, justifyContent: 'flex-start' }}
                  endIcon={<ArrowForwardIcon />}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1">Manage Courses</Typography>
                    <Typography variant="body2" color="textSecondary">{systemData.courses.total} Courses</Typography>
                  </Box>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  component={Link}
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector('[aria-label="Attendance"]')?.click();
                  }}
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{ p: 2, justifyContent: 'flex-start' }}
                  endIcon={<ArrowForwardIcon />}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1">Monitor Attendance</Typography>
                    <Typography variant="body2" color="textSecondary">{systemData.attendance.total} Records</Typography>
                  </Box>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  component={Link}
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector('[aria-label="Reports"]')?.click();
                  }}
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{ p: 2, justifyContent: 'flex-start' }}
                  endIcon={<ArrowForwardIcon />}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1">View Reports</Typography>
                    <Typography variant="body2" color="textSecondary">Generate Insights</Typography>
                  </Box>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemOverview; 