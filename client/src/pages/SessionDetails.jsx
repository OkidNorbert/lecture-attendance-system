import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import axios from 'axios';
import AttendanceMap from '../components/AttendanceMap';
import useRealTimeUpdates from '../hooks/useRealTimeUpdates';

const SessionDetails = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0
  });

  // New state for trends
  const [trends, setTrends] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    programComparison: []
  });

  const { realTimeData, error: wsError, isConnected } = useRealTimeUpdates(id);
  const [activeTimeframe, setActiveTimeframe] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);

  const COLORS = ['#4CAF50', '#f44336', '#FFA726'];

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    // Check if we have a valid ID parameter
    if (!id) {
      setError('Session ID is missing. Please go back and try again.');
      setLoading(false);
      return;
    }

    fetchSessionDetails();
  }, [id]);

  // Fetch trends data
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const token = localStorage.getItem('token');
        const [dailyRes, weeklyRes, monthlyRes, comparisonRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/attendance/trends/daily/${session?.courseId?._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/attendance/trends/weekly/${session?.courseId?._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/attendance/trends/monthly-comparison`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/attendance/trends/program-comparison`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setTrends({
          daily: dailyRes.data,
          weekly: weeklyRes.data,
          monthly: monthlyRes.data,
          programComparison: comparisonRes.data
        });
      } catch (err) {
        console.error('Error fetching trends:', err);
      }
    };

    if (session?.courseId?._id) {
      fetchTrends();
    }
  }, [session]);

  // Update session data when real-time updates arrive
  useEffect(() => {
    if (realTimeData && session) {
      setSession(prev => ({
        ...prev,
        presentCount: realTimeData.presentCount,
        attendees: [
          ...(prev.attendees || []).filter(a => 
            !realTimeData.recentCheckins?.find(rc => rc.student === a.studentId?.name)
          ),
          ...(realTimeData.recentCheckins || []).map(rc => ({
            studentId: { name: rc.student },
            checkInTime: rc.time,
            status: rc.status
          }))
        ]
      }));
    }
  }, [realTimeData]);

  useEffect(() => {
    if (wsError) {
      console.warn('WebSocket error:', wsError);
      // Don't need to show this to the user - will fall back to static data
    }
  }, [wsError]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Debug log to ensure we're using the correct ID
      console.log(`Fetching session details for ID: ${id}`);
      
      const response = await axios.get(`http://localhost:5000/api/attendance/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if the response contains valid data
      if (!response.data) {
        throw new Error('No session data returned from the server');
      }
      
      console.log('Session data received:', response.data);
      setSession(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error('Error fetching session details:', err);
      // Handle different error types
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          setError('Access denied. You may not have permission to view this session.');
        } else if (err.response.status === 404) {
          setError('Session not found. It may have been deleted or the ID is incorrect.');
        } else {
          setError(err.response.data?.msg || 'Failed to load session details. Please try again later.');
        }
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionData) => {
    if (!sessionData || !sessionData.attendees) {
      setAttendanceStats({ present: 0, absent: 0, late: 0 });
      return;
    }
    
    const stats = {
      present: sessionData.attendees.filter(a => a.status === 'present').length,
      late: sessionData.attendees.filter(a => a.status === 'late').length,
      absent: (sessionData.totalStudents || 0) - (sessionData.presentCount || 0)
    };
    setAttendanceStats(stats);
  };

  const pieData = [
    { name: 'Present', value: attendanceStats.present || 0 },
    { name: 'Absent', value: attendanceStats.absent || 0 },
    { name: 'Late', value: attendanceStats.late || 0 }
  ];

  const timeData = (session?.attendees || [])
    .filter(a => a.checkInTime)
    .map(a => ({
      time: new Date(a.checkInTime).toLocaleTimeString(),
      count: 1
    }))
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.time === curr.time);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [])
    .sort((a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time));

  // Function to switch between timeframes
  const handleTimeframeChange = async (timeframe) => {
    setActiveTimeframe(timeframe);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint;
      switch (timeframe) {
        case 'daily':
          endpoint = `/api/attendance/trends/daily/${session.courseId}`;
          break;
        case 'weekly':
          endpoint = `/api/attendance/trends/weekly/${session.courseId}`;
          break;
        case 'monthly':
          endpoint = `/api/attendance/trends/monthly-comparison`;
          break;
        default:
          endpoint = `/api/attendance/trends/daily/${session.courseId}`;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrends(prev => ({ ...prev, [timeframe]: response.data }));
    } catch (err) {
      setError(err.response?.data?.msg || 'Error fetching trend data');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Session Details</h2>
          <p className="text-gray-500">Please wait while we fetch the session information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Session</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => fetchSessionDetails()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/lecturer')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* WebSocket Connection Status */}
      {isConnected && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span 
              style={{ 
                display: 'inline-block', 
                width: '10px', 
                height: '10px', 
                backgroundColor: 'green', 
                borderRadius: '50%', 
                marginRight: '8px' 
              }}
            ></span>
            Real-time updates active
          </span>
        </Alert>
      )}

      {/* Real-time Updates Banner */}
      {realTimeData && realTimeData.lastUpdate && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Last updated: {new Date(realTimeData.lastUpdate).toLocaleTimeString()}
          {' | '}
          Current attendance rate: {realTimeData.attendanceRate ? realTimeData.attendanceRate.toFixed(1) : '0'}%
        </Alert>
      )}

      {/* Session Overview */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Session Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Course
                </Typography>
                <Typography variant="h5">
                  {session?.courseId?.name || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Program
                </Typography>
                <Typography variant="h5">
                  {session?.program || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Date & Time
                </Typography>
                <Typography variant="h5">
                  {session?.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Trend Analysis Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTimeframe}
            onChange={(e, newValue) => handleTimeframeChange(newValue)}
          >
            <Tab label="Daily" value="daily" />
            <Tab label="Weekly" value="weekly" />
            <Tab label="Monthly" value="monthly" />
          </Tabs>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {activeTimeframe === 'daily' && trends.daily && trends.daily.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends.daily}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendanceRate" name="Attendance Rate %" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {activeTimeframe === 'weekly' && trends.weekly && trends.weekly.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends.weekly}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#8884d8" />
                  <Line type="monotone" dataKey="average" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            )}
            {activeTimeframe === 'monthly' && trends.monthly && trends.monthly.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends.monthly}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="attendanceRate"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {!(
              (activeTimeframe === 'daily' && trends.daily && trends.daily.length > 0) ||
              (activeTimeframe === 'weekly' && trends.weekly && trends.weekly.length > 0) ||
              (activeTimeframe === 'monthly' && trends.monthly && trends.monthly.length > 0)
            ) && (
              <Box p={3} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  No trend data available for this timeframe
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Enhanced Visualization Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Distribution
            </Typography>
            {pieData && pieData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box p={3} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  No attendance data available yet
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Check-in Time Distribution
            </Typography>
            {timeData && timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeData}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Students" fill="#2196F3" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box p={3} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  No check-in data available yet
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Program Comparison Radar Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Program Attendance Comparison
            </Typography>
            {trends.programComparison && trends.programComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={trends.programComparison}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="program" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Attendance Rate"
                    dataKey="rate"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Box p={3} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  No program comparison data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Hourly Attendance Pattern */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hourly Attendance Pattern
            </Typography>
            {trends.daily && trends.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends.daily}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="attendanceRate"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box p={3} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  No hourly attendance data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Attendance Map */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Location Map
            </Typography>
            {session?.location?.latitude && session?.location?.longitude ? (
              <AttendanceMap
                sessionLocation={session.location}
                attendees={session.attendees || []}
                radius={session.radius || 50}
              />
            ) : (
              <Box p={3} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  No location data available for this session
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Attendees Table */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Attendance List
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {session?.attendees && session.attendees.length > 0 ? (
                session.attendees.map((attendee, index) => (
                  <TableRow key={index}>
                    <TableCell>{attendee?.studentId?.name || 'Unknown'}</TableCell>
                    <TableCell>{attendee?.studentId?.email || 'N/A'}</TableCell>
                    <TableCell>
                      {attendee?.checkInTime 
                        ? new Date(attendee.checkInTime).toLocaleTimeString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={attendee?.status || 'Unknown'}
                        color={
                          attendee?.status === 'present' 
                            ? 'success' 
                            : attendee?.status === 'late' 
                              ? 'warning' 
                              : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {attendee?.location?.latitude && attendee?.location?.longitude
                        ? `${attendee.location.latitude.toFixed(6)}, ${attendee.location.longitude.toFixed(6)}`
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No attendance records available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default SessionDetails; 