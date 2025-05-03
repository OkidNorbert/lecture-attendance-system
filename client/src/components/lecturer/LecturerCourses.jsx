import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import QrCodeIcon from '@mui/icons-material/QrCode';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const LecturerCourses = () => {
  const [courses, setCourses] = useState([]);
  const [enrollmentData, setEnrollmentData] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Set up websocket for real-time data updates
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000');
    
    socket.onopen = () => {
      console.log('WebSocket connection established for courses');
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'enrollment_update' || data.type === 'attendance_update') {
        fetchData(true);
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
    fetchData();
    
    // Poll for updates every minute
    const interval = setInterval(() => {
      fetchData(true);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);
      setError(null);
      
      // Fetch courses assigned to the lecturer
      const response = await axios.get('/api/courses/lecturer');
      const lecturerCourses = response.data.courses || [];
      setCourses(lecturerCourses);
      
      // For each course, fetch enrollment and attendance data
      if (lecturerCourses.length > 0) {
        await Promise.all([
          fetchEnrollmentData(lecturerCourses, silent),
          fetchAttendanceData(lecturerCourses, silent)
        ]);
      }
    } catch (err) {
      console.error('Error fetching lecturer courses:', err);
      if (!silent) setError('Failed to load course data. Please try again.');
    } finally {
      if (!silent) setLoading(false);
      if (silent) setRefreshing(false);
    }
  };

  const fetchEnrollmentData = async (lecturerCourses, silent) => {
    try {
      // Fetch enrollment counts for each course
      const enrollmentPromises = lecturerCourses.map(course => 
        axios.get(`/api/enrollments?courseId=${course.id}`)
      );
      
      const enrollmentResponses = await Promise.all(enrollmentPromises);
      
      // Create an object mapping course ID to enrollment count
      const enrollmentCounts = {};
      enrollmentResponses.forEach((response, index) => {
        const courseId = lecturerCourses[index].id;
        enrollmentCounts[courseId] = response.data.length;
      });
      
      setEnrollmentData(enrollmentCounts);
    } catch (err) {
      console.error('Error fetching enrollment data:', err);
      if (!silent) setError('Failed to load enrollment data.');
    }
  };
  
  const fetchAttendanceData = async (lecturerCourses, silent) => {
    try {
      // Fetch attendance sessions for each course
      const attendancePromises = lecturerCourses.map(course => 
        axios.get(`/api/attendance/sessions?courseId=${course.id}`)
      );
      
      const attendanceResponses = await Promise.all(attendancePromises);
      
      // Create an object mapping course ID to attendance stats
      const attendanceStats = {};
      attendanceResponses.forEach((response, index) => {
        const courseId = lecturerCourses[index].id;
        const sessions = response.data || [];
        
        const totalSessions = sessions.length;
        const totalAttendees = sessions.reduce((sum, session) => sum + (session.presentCount || 0), 0);
        const totalExpected = sessions.reduce((sum, session) => sum + (session.totalStudents || 0), 0);
        
        const attendanceRate = totalExpected > 0 
          ? Math.round((totalAttendees / totalExpected) * 100) 
          : 0;
        
        attendanceStats[courseId] = {
          totalSessions,
          totalAttendees,
          totalExpected,
          attendanceRate
        };
      });
      
      setAttendanceData(attendanceStats);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      if (!silent) setError('Failed to load attendance data.');
    }
  };
  
  const handleViewEnrollments = (courseId) => {
    navigate(`/course/${courseId}/enrollments`);
  };
  
  const handleViewAttendance = (courseId) => {
    navigate(`/course/${courseId}/attendance`);
  };
  
  const handleGenerateQR = (course) => {
    navigate('/generate-qr', { state: { selectedCourse: course } });
  };
  
  const handleRefresh = useCallback(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress color="primary" size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
        flexDirection={isMobile ? "column" : "row"}
      >
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
            fontWeight: 600, 
            color: '#1f2937',
            mb: isMobile ? 2 : 0 
          }}
        >
          My Courses
        </Typography>
        
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
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
          {refreshing ? 'Refreshing...' : 'Refresh Courses'}
        </Button>
      </Box>
      
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
      
      {courses.length === 0 ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: '12px',
          background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px dashed #cbd5e1'
        }}>
          <Typography variant="h6" color="#4B5563" gutterBottom>
            You haven't been assigned to any courses yet
          </Typography>
          <Typography variant="body1" color="#6B7280" sx={{ mb: 3 }}>
            Once you're assigned to teach courses, they will appear here
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(99, 102, 241, 0.15)'
            }}
          >
            Check Again
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} key={course.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                }
              }}>
                <Box sx={{ 
                  backgroundColor: '#6366F1', 
                  py: 1.5, 
                  px: 2.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      fontSize: isMobile ? '1rem' : '1.25rem'
                    }}
                  >
                    {course.name}
                  </Typography>
                  <Chip 
                    label={course.code} 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      border: 'none'
                    }}
                  />
                </Box>
                
                <CardContent sx={{ flexGrow: 1, px: 3, py: 2.5 }}>
                  <Box display="flex" alignItems="center" mb={1.5}>
                    <CalendarTodayIcon sx={{ color: '#6B7280', mr: 1, fontSize: '1rem' }} />
                    <Typography variant="body2" color="text.secondary">
                      <span style={{ fontWeight: 500, color: '#4B5563' }}>Program:</span> {course.program || 'Not specified'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#6B7280" style={{ width: '1rem', marginRight: '0.25rem' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ fontWeight: 500, color: '#4B5563' }}>Credit Hours:</span> {course.credits || 'N/A'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Badge 
                        badgeContent={enrollmentData[course.id] || 0} 
                        color="primary"
                        max={999}
                        sx={{ 
                          '& .MuiBadge-badge': { 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold', 
                            padding: '0 6px',
                            borderRadius: '6px',
                            height: '1.2rem',
                            minWidth: '1.2rem'
                          } 
                        }}
                      >
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 1.5, 
                            textAlign: 'center', 
                            backgroundColor: '#F3F4F6',
                            borderRadius: '8px'
                          }}
                        >
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#4B5563' }}>
                            Students
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color="primary" 
                            sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '1.25rem' 
                            }}
                          >
                            {enrollmentData[course.id] || 0}
                          </Typography>
                        </Paper>
                      </Badge>
                    </Grid>
                    <Grid item xs={6}>
                      <Badge 
                        badgeContent={attendanceData[course.id]?.totalSessions || 0} 
                        color="secondary"
                        max={999}
                        sx={{ 
                          '& .MuiBadge-badge': { 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold', 
                            padding: '0 6px',
                            borderRadius: '6px',
                            height: '1.2rem',
                            minWidth: '1.2rem'
                          } 
                        }}
                      >
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 1.5, 
                            textAlign: 'center', 
                            backgroundColor: '#F3F4F6',
                            borderRadius: '8px'
                          }}
                        >
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#4B5563' }}>
                            Sessions
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color="secondary" 
                            sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '1.25rem' 
                            }}
                          >
                            {attendanceData[course.id]?.totalSessions || 0}
                          </Typography>
                        </Paper>
                      </Badge>
                    </Grid>
                    <Grid item xs={12}>
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            fontWeight: 600,
                            color: '#4B5563'
                          }}
                        >
                          <span>Attendance rate</span>
                          <span>{attendanceData[course.id]?.attendanceRate || 0}%</span>
                        </Typography>
                        <Box 
                          sx={{ 
                            width: '100%', 
                            bgcolor: '#e2e8f0', 
                            height: '10px', 
                            borderRadius: '5px',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              width: `${attendanceData[course.id]?.attendanceRate || 0}%`,
                              height: '100%',
                              borderRadius: '5px',
                              bgcolor: (theme) => {
                                const rate = attendanceData[course.id]?.attendanceRate || 0;
                                if (rate >= 75) return '#10B981';
                                if (rate >= 50) return '#F59E0B';
                                return '#EF4444';
                              },
                              transition: 'width 1s ease-in-out'
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-around' }}>
                  <Button 
                    size="small" 
                    variant="contained"
                    startIcon={<PeopleIcon />}
                    onClick={() => handleViewEnrollments(course.id)}
                    sx={{ 
                      borderRadius: '8px',
                      backgroundColor: '#4F46E5',
                      '&:hover': {
                        backgroundColor: '#4338CA'
                      }
                    }}
                  >
                    Students
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained"
                    startIcon={<BarChartIcon />}
                    onClick={() => handleViewAttendance(course.id)}
                    color="success"
                    sx={{ 
                      borderRadius: '8px'
                    }}
                  >
                    Attendance
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                    onClick={() => handleGenerateQR(course)}
                    color="secondary"
                    sx={{ 
                      borderRadius: '8px'
                    }}
                  >
                    QR Code
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default LecturerCourses; 