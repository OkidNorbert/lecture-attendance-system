import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../utils/axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { format, parseISO } from 'date-fns';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

const CourseAttendance = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    labels: [],
    datasets: [{
      label: 'Attendance Rate (%)',
      data: [],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
    }]
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  useEffect(() => {
    if (courseId) {
      fetchData();
      fetchEnrollmentCount();
    }
  }, [courseId]);
  
  useEffect(() => {
    if (sessions.length > 0) {
      prepareChartData();
    }
  }, [sessions]);
  
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000');
    
    socket.onopen = () => {
      console.log('WebSocket connection established for attendance');
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'attendance_update' && data.courseId === courseId) {
        fetchData(true);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      socket.close();
    };
  }, [courseId]);

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [courseId]);
  
  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);
      setError(null);
      
      // Fetch data in parallel
      const [courseResponse, sessionsResponse, enrollmentsResponse] = await Promise.all([
        axios.get(`/api/courses/${courseId}`),
        axios.get(`/api/attendance/sessions?courseId=${courseId}`),
        axios.get(`/api/enrollments?courseId=${courseId}`)
      ]);
      
      setCourse(courseResponse.data);
      setSessions(sessionsResponse.data || []);
      setEnrollmentCount(enrollmentsResponse.data.length);
    } catch (err) {
      console.error('Error fetching course attendance data:', err);
      if (!silent) setError('Failed to load attendance data. Please try again.');
    } finally {
      if (!silent) setLoading(false);
      if (silent) setRefreshing(false);
    }
  };
  
  const fetchEnrollmentCount = async () => {
    try {
      const response = await axios.get(`/api/enrollments?courseId=${courseId}`);
      setEnrollmentCount(response.data.length);
    } catch (err) {
      console.error('Error fetching enrollment count:', err);
    }
  };
  
  const prepareChartData = () => {
    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Extract date labels and attendance rates
    const labels = sortedSessions.map(session => {
      const date = new Date(session.createdAt);
      return date.toLocaleDateString();
    });
    
    const data = sortedSessions.map(session => {
      if (session.totalStudents === 0) return 0;
      return Math.round((session.presentCount / session.totalStudents) * 100);
    });
    
    setAttendanceData({
      labels,
      datasets: [{
        label: 'Attendance Rate (%)',
        data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      }]
    });
  };
  
  const filteredSessions = () => {
    return sessions.filter(session => {
      const dateMatches = dateFilter ? new Date(session.createdAt).toLocaleDateString().includes(dateFilter) : true;
      const textMatches = searchTerm ? session.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return dateMatches && textMatches;
    });
  };
  
  const calculateOverallStats = () => {
    if (sessions.length === 0) {
      return { totalSessions: 0, avgAttendance: 0, totalStudentsAttended: 0 };
    }
    
    const totalSessions = sessions.length;
    const totalPresentCount = sessions.reduce((sum, session) => sum + (session.presentCount || 0), 0);
    const totalExpectedCount = sessions.reduce((sum, session) => sum + (session.totalStudents || 0), 0);
    
    const avgAttendance = totalExpectedCount > 0 
      ? Math.round((totalPresentCount / totalExpectedCount) * 100) 
      : 0;
    
    return {
      totalSessions,
      avgAttendance,
      totalStudentsAttended: totalPresentCount
    };
  };
  
  const handleViewSessionDetails = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };
  
  const handleExportData = async () => {
    try {
      // Request a CSV download from the backend
      const response = await axios.get(`/api/attendance/export?courseId=${courseId}&format=csv`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate a filename with course code if available
      const courseCode = course?.course_code || courseId;
      link.setAttribute('download', `attendance_${courseCode}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting attendance data:', err);
      setError('Failed to export attendance data');
    }
  };
  
  const handleBack = () => {
    navigate('/lecturer');
  };

  const getAttendanceRate = (session) => {
    if (!session.presentCount || !session.totalStudents) return 0;
    return Math.round((session.presentCount / session.totalStudents) * 100);
  };

  const handleCreateSession = () => {
    navigate('/generate-qr', { state: { selectedCourse: course } });
  };

  const handleRefresh = useCallback(() => {
    fetchData();
  }, []);

  const handleExportAttendance = (sessionId) => {
    window.open(`/api/attendance/export?sessionId=${sessionId}`, '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress color="primary" size={60} thickness={4} />
      </Box>
    );
  }

  const stats = calculateOverallStats();

  return (
    <Box>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
        flexDirection={isMobile ? "column" : "row"}
      >
        <Box display="flex" alignItems="center" mb={isMobile ? 2 : 0}>
          <IconButton 
            onClick={handleBack}
            sx={{ mr: 1, color: '#6366F1' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              color: '#1f2937'
            }}
          >
            {course ? `${course.course_name} (${course.course_code})` : 'Course Attendance'}
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
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
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleCreateSession}
            disabled={!course}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(99, 102, 241, 0.15)'
            }}
          >
            New Session
          </Button>
        </Box>
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
      
      {course && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
            }}>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                p: 3,
                color: 'white' 
              }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                  Total Sessions
                </Typography>
                <Box display="flex" alignItems="center">
                  <CalendarTodayIcon sx={{ fontSize: '2rem', mr: 1.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalSessions}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            }}>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                p: 3,
                color: 'white' 
              }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                  Average Attendance
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{ 
                      width: 35, 
                      height: 35, 
                      mr: 1.5,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      %
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.avgAttendance}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
            }}>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                p: 3,
                color: 'white' 
              }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                  Total Attendances
                </Typography>
                <Box display="flex" alignItems="center">
                  <CheckIcon sx={{ fontSize: '2rem', mr: 1.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalStudentsAttended}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
            }}>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                p: 3,
                color: 'white' 
              }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                  Enrolled Students
                </Typography>
                <Box display="flex" alignItems="center">
                  <GroupIcon sx={{ fontSize: '2rem', mr: 1.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {enrollmentCount}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {sessions.length === 0 ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: '12px',
          background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px dashed #cbd5e1'
        }}>
          <Typography variant="h6" color="#4B5563" gutterBottom>
            No attendance sessions found
          </Typography>
          <Typography variant="body1" color="#6B7280" sx={{ mb: 3 }}>
            Click the button below to create a new attendance session
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCreateSession}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(99, 102, 241, 0.15)'
            }}
          >
            Create New Session
          </Button>
        </Paper>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            overflow: 'hidden',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Attendance</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSessions().map((session) => (
                <TableRow 
                  key={session._id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: '#F9FAFB',
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => handleViewSessionDetails(session)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <CalendarTodayIcon sx={{ color: '#6366F1', mr: 1, fontSize: '1.2rem' }} />
                      {session.date ? format(parseISO(session.date), 'PPP') : 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <AccessTimeIcon sx={{ color: '#F59E0B', mr: 1, fontSize: '1.2rem' }} />
                      {session.time ? format(parseISO(session.time), 'p') : 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {session.presentCount || 0} / {session.totalStudents || 0} students
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${getAttendanceRate(session)}%`}
                      sx={{
                        bgcolor: (() => {
                          const rate = getAttendanceRate(session);
                          if (rate >= 75) return 'rgba(16, 185, 129, 0.1)';
                          if (rate >= 50) return 'rgba(245, 158, 11, 0.1)';
                          return 'rgba(239, 68, 68, 0.1)';
                        })(),
                        color: (() => {
                          const rate = getAttendanceRate(session);
                          if (rate >= 75) return '#059669';
                          if (rate >= 50) return '#D97706';
                          return '#DC2626';
                        })(),
                        fontWeight: 'bold',
                        border: 'none'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={session.active ? <CheckIcon /> : <CloseIcon />}
                      label={session.active ? 'Active' : 'Closed'} 
                      color={session.active ? 'success' : 'default'}
                      size="small"
                      sx={{ 
                        fontWeight: 'medium',
                        borderRadius: '6px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View Details">
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSessionDetails(session);
                          }}
                          sx={{ 
                            borderRadius: '6px',
                            minWidth: 0,
                            px: 1.5
                          }}
                        >
                          View
                        </Button>
                      </Tooltip>
                      <Tooltip title="Export Data">
                        <IconButton 
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportAttendance(session._id);
                          }}
                          sx={{ 
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px'
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={showSessionDetails} onClose={() => setShowSessionDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Session Details
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Session ID</Typography>
                  <Typography variant="body1">{selectedSession.sessionId}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Date</Typography>
                  <Typography variant="body1">{new Date(selectedSession.createdAt).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Students Present</Typography>
                  <Typography variant="body1">{selectedSession.presentCount || 0} / {selectedSession.totalStudents || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Chip 
                    label={selectedSession.status || 'active'} 
                    color={
                      selectedSession.status === 'completed' ? 'success' :
                      selectedSession.status === 'cancelled' ? 'error' : 
                      'primary'
                    }
                    size="small"
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Attendee List</Typography>
              
              {selectedSession.attendees && selectedSession.attendees.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Check-in Time</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSession.attendees.map((attendee, index) => (
                        <TableRow key={index}>
                          <TableCell>{attendee.studentId?.first_name} {attendee.studentId?.last_name}</TableCell>
                          <TableCell>{attendee.checkInTime ? new Date(attendee.checkInTime).toLocaleTimeString() : 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={attendee.status} 
                              color={
                                attendee.status === 'present' ? 'success' :
                                attendee.status === 'late' ? 'warning' : 
                                'error'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No detailed attendee information available for this session
                </Typography>
              )}
              
              <Box mt={2}>
                <Button 
                  variant="outlined"
                  onClick={() => navigate(`/session/${selectedSession._id}`)}
                >
                  View Full Session Details
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSessionDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseAttendance; 