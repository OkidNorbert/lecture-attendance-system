import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';

const Reports = () => {
  const [filters, setFilters] = useState({
    courseId: '',
    lecturerId: '',
    studentId: '',
    startDate: '',
    endDate: '',
  });
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingSamples, setGeneratingSamples] = useState(false);

  useEffect(() => {
    fetchInitialData();
    fetchData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Add debug logging
      console.log('Fetching initial data...');

      const [coursesRes, lecturersRes, studentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/courses', { headers }),
        axios.get('http://localhost:5000/api/admin/users?role=lecturer', { headers }),
        axios.get('http://localhost:5000/api/admin/users?role=student', { headers })
      ]);

      // Log responses
      console.log('Courses response:', coursesRes.data);
      console.log('Lecturers response:', lecturersRes.data);
      console.log('Students response:', studentsRes.data);

      setCourses(coursesRes.data);
      setLecturers(lecturersRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load dropdown data: ' + (error.response?.data?.msg || error.message));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [trendsResponse, statsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/reports/attendance-trends', { headers }),
        axios.get('http://localhost:5000/api/admin/reports/course-stats', { headers })
      ]);

      // Process attendance trends data
      const processedTrends = trendsResponse.data.map(day => {
        // Add safety check for statuses
        const statuses = day.statuses || [];
        return {
          date: day._id,
          present: statuses.find(s => s.status === 'present')?.count || 0,
          absent: statuses.find(s => s.status === 'absent')?.count || 0,
          late: statuses.find(s => s.status === 'late')?.count || 0
        };
      });

      setAttendanceTrends(processedTrends);
      setCourseStats(statsResponse.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.msg || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/attendance-report?${queryParams}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleExport = () => {
    // Implementation for exporting to Excel/PDF
    console.log('Exporting report...');
  };

  const generateSampleData = async () => {
    try {
      setGeneratingSamples(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/admin/generate-sample-data',
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      // Refresh the data after generating samples
      await fetchData();
    } catch (err) {
      console.error('Error generating sample data:', err);
      setError('Failed to generate sample data');
    } finally {
      setGeneratingSamples(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Attendance Reports
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Report Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Course"
                  value={filters.courseId}
                  onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
                >
                  {courses.map((course) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Lecturer"
                  value={filters.lecturerId}
                  onChange={(e) => setFilters({ ...filters, lecturerId: e.target.value })}
                >
                  {lecturers.map((lecturer) => (
                    <MenuItem key={lecturer._id} value={lecturer._id}>
                      {lecturer.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Student"
                  value={filters.studentId}
                  onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                >
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={generateReport}
                    fullWidth
                  >
                    Generate
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleExport}
                    fullWidth
                  >
                    Export
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={generateSampleData}
                    disabled={generatingSamples}
                    sx={{ ml: 1 }}
                  >
                    {generatingSamples ? 'Generating...' : 'Generate Sample Data'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Attendance Trends Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Trends (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#4caf50" name="Present" />
                <Line type="monotone" dataKey="absent" stroke="#f44336" name="Absent" />
                <Line type="monotone" dataKey="late" stroke="#ff9800" name="Late" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Course Statistics Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Course Attendance Rates
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={courseStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="courseCode" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendanceRate" fill="#2196f3" name="Attendance Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Report Results */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Report Results
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>{record.student?.name}</TableCell>
                      <TableCell>{record.course?.name}</TableCell>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>
                        {record.location
                          ? `${record.location.latitude}, ${record.location.longitude}`
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 