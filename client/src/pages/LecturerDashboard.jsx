import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axios';
import { useNavigate, Link, useLocation, Routes, Route } from 'react-router-dom';
import LecturerCourses from '../components/lecturer/LecturerCourses';
import CourseEnrollments from '../components/lecturer/CourseEnrollments';
import CourseAttendance from '../components/lecturer/CourseAttendance';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SchoolIcon from '@mui/icons-material/School';
import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const LecturerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [lecturerCourses, setLecturerCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Setup websocket for real-time updates
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000');
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'attendance_update') {
        fetchDashboardData();
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Poll for updates every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    // Set active tab based on current path
    if (location.pathname === '/lecturer') {
      setActiveTab(0);
    } else if (location.pathname === '/generate-qr') {
      setActiveTab(1);
    } else if (location.pathname === '/attendance-history') {
      setActiveTab(2);
    }
  }, [location.pathname]);

  const fetchDashboardData = async (silent = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    try {
      if (!silent) setIsLoading(true);
      if (silent) setRefreshing(true);
      setError(null);
      
      // Fetch user data
      const userResponse = await axios.get("/api/auth/me");
      setUser(userResponse.data);
      
      if (userResponse.data.role !== "lecturer") {
        navigate("/dashboard");
        return;
      }
      
      // Fetch stats, courses, and sessions in parallel
      const [statsRes, coursesRes, sessionsRes] = await Promise.all([
        axios.get("/api/attendance/stats"),
        axios.get("/api/courses/lecturer"),
        axios.get("/api/attendance/sessions?limit=5")
      ]);
      
      // Format and set stats data
      const statsData = statsRes.data || {};
      setStats({
        totalSessions: statsData.totalSessions || 0,
        totalStudents: statsData.totalStudents || 0,
        averageAttendance: statsData.averageAttendance || 0
      });
      
      // Set lecturer courses
      setLecturerCourses(coursesRes.data?.courses || []);
      
      // Validate and set sessions data - ensure we're not displaying empty or placeholder data
      if (sessionsRes.data && Array.isArray(sessionsRes.data)) {
        // Filter out any invalid session objects
        const validSessions = sessionsRes.data.filter(session => 
          session && session._id && session.course
        );
        
        if (validSessions.length > 0) {
          setRecentSessions(validSessions);
        } else {
          setRecentSessions([]);
        }
      } else {
        // If no valid sessions data
        setRecentSessions([]);
      }
      
      console.log("Dashboard data loaded successfully", {
        sessionCount: (sessionsRes.data || []).length,
        courseCount: (coursesRes.data?.courses || []).length
      });
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      if (!silent) {
        if (err.response?.status === 404) {
          // Handle 404 errors gracefully
          setError("No data found. You may need to be assigned to courses first.");
        } else {
          setError("Failed to load dashboard data. Please try again.");
        }
      }
      // Reset data to empty states on error
      if (!silent) {
        setRecentSessions([]);
        setLecturerCourses([]);
      }
    } finally {
      if (!silent) setIsLoading(false);
      if (silent) setRefreshing(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    if (newValue === 0) {
      navigate('/lecturer');
    } else if (newValue === 1) {
      navigate('/generate-qr');
    } else if (newValue === 2) {
      navigate('/attendance-history');
    }
  };

  const refreshDashboard = useCallback(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  // Render loading state
  if (isLoading) {
    return (
      <Box 
        sx={{
          minHeight: '100vh', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)'
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#5569ff' }} />
        <Typography variant="h6" color="primary" sx={{ mt: 2, fontWeight: 500 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // Main dashboard overview - this is shown when path is /lecturer
  const DashboardOverview = () => (
    <Box>
      {/* Quick Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: 'white',
            borderRadius: '12px',
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)'
            }
          }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <Box 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  p: 1, 
                  mb: 2 
                }}
              >
                <DashboardIcon fontSize="large" />
              </Box>
              <Typography variant="h6" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h3" sx={{ my: 2, fontWeight: 'bold' }}>
                {stats.totalSessions}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Classes conducted this semester
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
            color: 'white',
            borderRadius: '12px',
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 20px rgba(236, 72, 153, 0.3)'
            }
          }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <Box 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  p: 1, 
                  mb: 2 
                }}
              >
                <SchoolIcon fontSize="large" />
              </Box>
              <Typography variant="h6" gutterBottom>
                Total Students
              </Typography>
              <Typography variant="h3" sx={{ my: 2, fontWeight: 'bold' }}>
                {stats.totalStudents}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Students taught across courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            color: 'white',
            borderRadius: '12px',
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)'
            }
          }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <Box 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  p: 1, 
                  mb: 2 
                }}
              >
                <BarChartIcon fontSize="large" />
              </Box>
              <Typography variant="h6" gutterBottom>
                Average Attendance
              </Typography>
              <Typography variant="h3" sx={{ my: 2, fontWeight: 'bold' }}>
                {stats.averageAttendance}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Overall attendance rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Courses Section */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2" fontWeight="600" color="#333">
            My Courses
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/lecturer/courses')}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(99, 102, 241, 0.15)'
            }}
          >
            View All Courses
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {lecturerCourses.length > 0 ? (
            lecturerCourses.slice(0, 3).map((course) => (
              <Grid item xs={12} sm={6} lg={4} key={course.id}>
                <Card sx={{ 
                  height: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                  }
                }}>
                  <CardContent>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: 2 
                      }}
                    >
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        {course.name}
                      </Typography>
                      <Chip 
                        label={course.code} 
                        color="primary" 
                        size="small" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Program: <span style={{ fontWeight: 500 }}>{course.program || 'N/A'}</span>
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Box display="flex" justifyContent="space-around" mt={1.5}>
                      <Button 
                        variant="contained"
                        size="small" 
                        startIcon={<SchoolIcon />}
                        onClick={() => navigate(`/course/${course.id}/enrollments`)}
                        sx={{ 
                          borderRadius: '8px',
                          backgroundColor: '#6366F1',
                          '&:hover': {
                            backgroundColor: '#4F46E5'
                          }
                        }}
                      >
                        Students
                      </Button>
                      <Button 
                        variant="contained"
                        size="small" 
                        startIcon={<BarChartIcon />}
                        onClick={() => navigate(`/course/${course.id}/attendance`)}
                        sx={{ 
                          borderRadius: '8px',
                          backgroundColor: '#10B981',
                          '&:hover': {
                            backgroundColor: '#059669'
                          }
                        }}
                      >
                        Attendance
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1'
              }}>
                <Typography variant="body1" color="text.secondary">
                  You haven't been assigned to any courses yet.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  sx={{ mt: 2, borderRadius: '8px' }}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Recent Sessions Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" fontWeight="600" color="#333" gutterBottom>
          Recent Sessions
        </Typography>
        
        {recentSessions && recentSessions.length > 0 ? (
          <TableContainer component={Paper} sx={{ 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Attendance</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSessions.map((session) => {
                  // Only show actual session data (not placeholder dummy data)
                  if (!session || !session._id) return null;
                  
                  const attendanceRate = session.totalStudents > 0 
                    ? Math.round((session.presentCount / session.totalStudents) * 100) 
                    : 0;
                  
                  return (
                    <TableRow key={session._id} sx={{ 
                      '&:hover': { 
                        backgroundColor: '#f8fafc' 
                      } 
                    }}>
                      <TableCell><strong>{session.course?.name || 'N/A'}</strong></TableCell>
                      <TableCell>{new Date(session.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box 
                            sx={{ 
                              width: '100%', 
                              bgcolor: '#e2e8f0', 
                              height: '8px', 
                              borderRadius: '4px', 
                              mr: 1,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${attendanceRate}%`,
                                height: '100%',
                                bgcolor: attendanceRate > 75 ? '#10B981' : attendanceRate > 50 ? '#F59E0B' : '#EF4444',
                                borderRadius: '4px'
                              }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight="medium">
                            {session.presentCount} / {session.totalStudents} ({attendanceRate}%)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={session.status} 
                          color={
                            session.status === 'completed' ? 'success' :
                            session.status === 'cancelled' ? 'error' : 
                            'primary'
                          } 
                          size="small" 
                          sx={{ 
                            fontWeight: 'medium',
                            borderRadius: '6px'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => navigate(`/session/${session._id}`)}
                          sx={{ 
                            borderRadius: '8px',
                            boxShadow: 'none',
                            '&:hover': {
                              boxShadow: '0 4px 6px rgba(99, 102, 241, 0.15)'
                            }
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px dashed #cbd5e1'
          }}>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2
                }}
              >
                <DashboardIcon sx={{ fontSize: 40, color: '#6366F1' }} />
              </Box>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                No active sessions yet
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              You haven't created any attendance sessions yet. Start by generating a QR code for one of your courses.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<QrCodeIcon />}
              onClick={() => navigate('/generate-qr')}
              sx={{ 
                mt: 1,
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(99, 102, 241, 0.15)',
                py: 1.5,
                px: 3,
                background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                  boxShadow: '0 6px 15px rgba(99, 102, 241, 0.35)',
                }
              }}
            >
              Generate QR Code
            </Button>
          </Paper>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f9fafb',
      pb: 6,
      width: '100vw',
      maxWidth: '100%',
      overflowX: 'hidden',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      position: 'absolute',
      top: 0,
      left: 0
    }}>
      {/* Header */}
      <Box 
        sx={{ 
          bgcolor: 'white', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
          mb: 4,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          left: 0,
          right: 0
        }}
      >
        <Container maxWidth={false} sx={{ 
          width: '100%', 
          maxWidth: '100% !important', 
          px: { xs: 2, sm: 3, md: 4 },
          margin: 0
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" py={2}>
            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold" color="#1f2937">
                Lecturer Dashboard
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Welcome, {user?.first_name} {user?.last_name}
              </Typography>
            </Box>
            
            <Box display="flex" gap={1}>
              <Button 
                variant="outlined"
                startIcon={refreshing ? <AutorenewIcon className="animate-spin" /> : <RefreshIcon />}
                onClick={refreshDashboard}
                disabled={refreshing}
                sx={{
                  borderRadius: '8px',
                  borderColor: '#6366F1',
                  color: '#6366F1',
                  '&:hover': {
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)'
                  }
                }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Button 
                variant="contained"
                color="primary"
                onClick={() => navigate('/generate-qr')}
                startIcon={<QrCodeIcon />}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: '#6366F1',
                  '&:hover': {
                    backgroundColor: '#4F46E5'
                  }
                }}
              >
                Generate QR
              </Button>
              
              <Button 
                variant="outlined"
                color="error"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  borderRadius: '8px'
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
          
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ 
              mb: -0.5,
              '& .MuiTab-root': {
                minWidth: isMobile ? 'auto' : 120,
                fontWeight: 600
              },
              '& .Mui-selected': {
                color: '#6366F1', 
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#6366F1',
                height: 3
              }
            }}
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab label="Dashboard" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Generate QR" id="tab-1" aria-controls="tabpanel-1" />
            <Tab label="Attendance History" id="tab-2" aria-controls="tabpanel-2" />
          </Tabs>
        </Container>
      </Box>
      
      {/* Main Content */}
      <Container maxWidth={false} sx={{ 
        px: { xs: 2, sm: 3, md: 4 }, 
        width: '100%',
        maxWidth: '100% !important',
        boxSizing: 'border-box',
        margin: 0
      }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)'
            }}
          >
            {error}
          </Alert>
        )}
        
        {/* Render page content based on route */}
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/courses" element={<LecturerCourses />} />
          <Route path="/course/:courseId/enrollments" element={<CourseEnrollments />} />
          <Route path="/course/:courseId/attendance" element={<CourseAttendance />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default LecturerDashboard;
