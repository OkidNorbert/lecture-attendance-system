import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const AttendanceMonitoring = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    activeSessionsCount: 0,
  });

  useEffect(() => {
    fetchActiveSessions();
    fetchRecentAttendance();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/admin/active-sessions');
      const data = await response.json();
      setActiveSessions(data);
      setStats(prev => ({ ...prev, activeSessionsCount: data.length }));
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const response = await fetch('/api/admin/attendance');
      const data = await response.json();
      setRecentAttendance(data);
      
      // Calculate statistics
      const present = data.filter(record => record.status === 'present').length;
      setStats(prev => ({
        ...prev,
        totalPresent: present,
        totalAbsent: data.length - present,
      }));
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Statistics Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography variant="h4">
                  {stats.activeSessionsCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Present Today
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.totalPresent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Absent Today
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.totalAbsent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Active Sessions */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Active Sessions
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Lecturer</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Expiry Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeSessions.map((session) => (
                <TableRow key={session._id}>
                  <TableCell>{session.course.name}</TableCell>
                  <TableCell>{session.lecturer.name}</TableCell>
                  <TableCell>
                    {new Date(session.startTime).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    {new Date(session.expiryTime).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color="success"
                      label="Active"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Recent Attendance */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Recent Attendance Records
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentAttendance.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>{record.student.name}</TableCell>
                  <TableCell>{record.course.name}</TableCell>
                  <TableCell>
                    {new Date(record.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {record.status === 'present' ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Present"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<CancelIcon />}
                        label="Absent"
                        color="error"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {record.location ? (
                      `${record.location.latitude}, ${record.location.longitude}`
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default AttendanceMonitoring; 