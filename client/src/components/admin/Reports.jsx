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
} from 'recharts';

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

  useEffect(() => {
    fetchInitialData();
    fetchAttendanceTrends();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [coursesRes, lecturersRes, studentsRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/users?role=lecturer'),
        fetch('/api/admin/users?role=student'),
      ]);

      const [coursesData, lecturersData, studentsData] = await Promise.all([
        coursesRes.json(),
        lecturersRes.json(),
        studentsRes.json(),
      ]);

      setCourses(coursesData);
      setLecturers(lecturersData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchAttendanceTrends = async () => {
    try {
      const response = await fetch('/api/admin/student-attendance-trends');
      const data = await response.json();
      setAttendanceTrends(data);
    } catch (error) {
      console.error('Error fetching attendance trends:', error);
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

  return (
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
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Attendance Trends Chart */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Attendance Trends
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Attendance Count" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
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
  );
};

export default Reports; 