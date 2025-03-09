import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Tab,
  Tabs,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';

// Import sub-components if needed
import SessionDetails from './SessionDetails';
import AttendanceHistory from './AttendanceHistory';
import GenerateQR from './GenerateQR';

const LecturerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0
  });
  const [filters, setFilters] = useState({
    program: '',
    course: '',
    department: '',
    sessionDate: ''
  });
  const [records, setRecords] = useState([]);
  const [lecturerCourses, setLecturerCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    try {
      const [statsRes, coursesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/attendance/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/courses/lecturer", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      setStats(statsRes.data);
      setLecturerCourses(coursesRes.data);
    } catch (err) {
      setError("Failed to load dashboard data");
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExport = async (format) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `http://localhost:5000/api/attendance/export?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export records");
    }
  };

  return (
    <Container maxWidth="xl">
      <LogoutButton />
      {/* Dashboard Header */}
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lecturer Dashboard
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h6">Total Sessions</Typography>
            <Typography variant="h4">{stats.totalSessions}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
            <Typography variant="h6">Total Students</Typography>
            <Typography variant="h4">{stats.totalStudents}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 40, color: 'success.main' }} />
            <Typography variant="h6">Average Attendance</Typography>
            <Typography variant="h4">{stats.averageAttendance}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Sessions" icon={<SchoolIcon />} />
          <Tab label="Generate QR" icon={<QrCodeIcon />} />
          <Tab label="Attendance History" icon={<AssessmentIcon />} />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Program</InputLabel>
                    <Select
                      value={filters.program}
                      onChange={(e) => setFilters({...filters, program: e.target.value})}
                    >
                      <MenuItem value="">All Programs</MenuItem>
                      {lecturerCourses.programs?.map(program => (
                        <MenuItem key={program} value={program}>{program}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={filters.course}
                      onChange={(e) => setFilters({...filters, course: e.target.value})}
                    >
                      <MenuItem value="">All Courses</MenuItem>
                      {lecturerCourses.courses?.map(course => (
                        <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={filters.department}
                      onChange={(e) => setFilters({...filters, department: e.target.value})}
                    >
                      <MenuItem value="">All Departments</MenuItem>
                      {lecturerCourses.departments?.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    type="date"
                    fullWidth
                    label="Session Date"
                    value={filters.sessionDate}
                    onChange={(e) => setFilters({...filters, sessionDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              {/* Export Buttons */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('csv')}
                >
                  Export CSV
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('pdf')}
                >
                  Export PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('xlsx')}
                >
                  Export Excel
                </Button>
              </Box>

              {/* Sessions Table */}
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <Box sx={{ minWidth: 800 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '16px', textAlign: 'left' }}>Program</th>
                        <th style={{ padding: '16px', textAlign: 'left' }}>Course</th>
                        <th style={{ padding: '16px', textAlign: 'left' }}>Department</th>
                        <th style={{ padding: '16px', textAlign: 'left' }}>Session Date</th>
                        <th style={{ padding: '16px', textAlign: 'left' }}>Attendance</th>
                        <th style={{ padding: '16px', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, index) => (
                        <tr key={index}>
                          <td style={{ padding: '16px' }}>{record.program}</td>
                          <td style={{ padding: '16px' }}>{record.course}</td>
                          <td style={{ padding: '16px' }}>{record.department}</td>
                          <td style={{ padding: '16px' }}>
                            {new Date(record.sessionDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {record.presentCount}/{record.totalStudents}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <Button
                              variant="text"
                              onClick={() => navigate(`/session-details/${record.sessionId}`)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            </Box>
          )}
          {activeTab === 1 && <GenerateQR />}
          {activeTab === 2 && <AttendanceHistory />}
        </Box>
      </Paper>
    </Container>
  );
};

export default LecturerDashboard;
