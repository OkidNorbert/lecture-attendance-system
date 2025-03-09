import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

  const { realTimeData, error: wsError } = useRealTimeUpdates(id);
  const [activeTimeframe, setActiveTimeframe] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);

  const COLORS = ['#4CAF50', '#f44336', '#FFA726'];

  useEffect(() => {
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
    if (realTimeData) {
      setSession(prev => ({
        ...prev,
        presentCount: realTimeData.presentCount,
        attendees: [
          ...prev.attendees.filter(a => 
            !realTimeData.recentCheckins.find(rc => rc.student === a.studentId.name)
          ),
          ...realTimeData.recentCheckins.map(rc => ({
            studentId: { name: rc.student },
            checkInTime: rc.time,
            status: rc.status
          }))
        ]
      }));
    }
  }, [realTimeData]);

  const fetchSessionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/attendance/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSession(response.data);
      calculateStats(response.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error fetching session details');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionData) => {
    const stats = {
      present: sessionData.attendees.filter(a => a.status === 'present').length,
      late: sessionData.attendees.filter(a => a.status === 'late').length,
      absent: sessionData.totalStudents - sessionData.presentCount
    };
    setAttendanceStats(stats);
  };

  const pieData = [
    { name: 'Present', value: attendanceStats.present },
    { name: 'Absent', value: attendanceStats.absent },
    { name: 'Late', value: attendanceStats.late }
  ];

  const timeData = session?.attendees
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Real-time Updates Banner */}
      {realTimeData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Last updated: {new Date(realTimeData.lastUpdate).toLocaleTimeString()}
          {' | '}
          Current attendance rate: {realTimeData.attendanceRate.toFixed(1)}%
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
                  {session?.courseId?.name}
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
                  {session?.program}
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
                  {new Date(session?.createdAt).toLocaleString()}
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
            {activeTimeframe === 'daily' && (
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
            {activeTimeframe === 'weekly' && (
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
            {activeTimeframe === 'monthly' && (
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
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Check-in Time Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeData}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Students" fill="#2196F3" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Program Comparison Radar Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Program Attendance Comparison
            </Typography>
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
          </Paper>
        </Grid>

        {/* Hourly Attendance Pattern */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hourly Attendance Pattern
            </Typography>
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
          </Paper>
        </Grid>

        {/* Attendance Map */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Location Map
            </Typography>
            {session?.location && (
              <AttendanceMap
                sessionLocation={session.location}
                attendees={session.attendees}
                radius={session.radius || 50}
              />
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
              {session?.attendees.map((attendee, index) => (
                <TableRow key={index}>
                  <TableCell>{attendee.studentId.name}</TableCell>
                  <TableCell>{attendee.studentId.email}</TableCell>
                  <TableCell>
                    {attendee.checkInTime 
                      ? new Date(attendee.checkInTime).toLocaleTimeString()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attendee.status}
                      color={
                        attendee.status === 'present' 
                          ? 'success' 
                          : attendee.status === 'late' 
                            ? 'warning' 
                            : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {attendee.location 
                      ? `${attendee.location.latitude.toFixed(6)}, ${attendee.location.longitude.toFixed(6)}`
                      : 'N/A'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default SessionDetails; 