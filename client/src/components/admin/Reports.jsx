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
  Alert,
  Snackbar,
  IconButton
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
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FileDownload as FileDownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from '../../utils/axios';

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
  const [filteredData, setFilteredData] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingSamples, setGeneratingSamples] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  
  // Define date format for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  useEffect(() => {
    fetchInitialData();
    fetchData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Add debug logging
      console.log('Fetching initial data...');

      const [coursesRes, lecturersRes, studentsRes] = await Promise.all([
        axios.get('/api/admin/courses'),
        axios.get('/api/admin/users?role=lecturer'),
        axios.get('/api/admin/users?role=student')
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

      // Generate mock data for demos if needed
      const mockTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          present: Math.floor(Math.random() * 50) + 30,
          absent: Math.floor(Math.random() * 20) + 5,
          late: Math.floor(Math.random() * 15) + 2
        };
      });

      // Create default course stats in case we need a fallback
      const defaultCourseStats = Array.from({ length: 5 }, (_, i) => ({
        courseName: `Course ${i + 1}`,
        courseCode: `CS${100 + i}`,
        attendanceRate: Math.floor(Math.random() * 40) + 60,
        totalSessions: Math.floor(Math.random() * 20) + 10
      }));

      // Generate a more comprehensive set of mock attendance data
      const generateMockAttendanceData = (numRecords = 100) => {
        return Array.from({ length: numRecords }, (_, i) => {
          // Generate a date within the last 60 days
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 60));
          
          // Randomly select a course, student, and lecturer
          const courseIndex = Math.floor(Math.random() * (courses.length || 1));
          const studentIndex = Math.floor(Math.random() * (students.length || 1));
          const lecturerIndex = Math.floor(Math.random() * (lecturers.length || 1));
          
          const course = courses[courseIndex] || { 
            _id: `course-${courseIndex}`, 
            name: `Course ${courseIndex + 1}`,
            code: `CS-${100 + courseIndex}`
          };
          
          const student = students[studentIndex] || {
            _id: `student-${studentIndex}`,
            name: `Student ${studentIndex + 1}`,
            email: `student${studentIndex + 1}@example.com`
          };
          
          const lecturer = lecturers[lecturerIndex] || {
            _id: `lecturer-${lecturerIndex}`,
            name: `Lecturer ${lecturerIndex + 1}`
          };
          
          return {
            _id: `record-${i}`,
            date: date.toISOString(),
            status: ['present', 'absent', 'late'][Math.floor(Math.random() * 3)],
            student: student,
            course: course,
            lecturer: lecturer,
            location: {
              latitude: (Math.random() * 0.1 + 51.5).toFixed(4),
              longitude: (Math.random() * 0.1 - 0.05).toFixed(4)
            }
          };
        });
      };

      // Generate course statistics based on the mock attendance data
      const generateCourseStats = (attendanceData, availableCourses) => {
        // Group attendance by course
        const coursesMap = new Map();
        
        // Initialize with all available courses
        availableCourses.forEach(course => {
          coursesMap.set(course._id, { 
            courseName: course.name,
            courseCode: course.code,
            attendanceRate: 0,
            totalSessions: 0,
            presentCount: 0
          });
        });
        
        // Count attendance for each course
        attendanceData.forEach(record => {
          const courseId = record.course._id;
          if (!coursesMap.has(courseId)) return;
          
          const stats = coursesMap.get(courseId);
          stats.totalSessions++;
          if (record.status === 'present') {
            stats.presentCount++;
          }
        });
        
        // Calculate attendance rates
        return Array.from(coursesMap.values()).map(stats => ({
          ...stats,
          attendanceRate: stats.totalSessions > 0 
            ? Math.round((stats.presentCount / stats.totalSessions) * 100) 
            : 0
        }));
      };

      const mockStudentPerformance = [
        { name: "Present", value: 75, color: "#4caf50" },
        { name: "Absent", value: 15, color: "#f44336" },
        { name: "Late", value: 10, color: "#ff9800" }
      ];

      try {
        // Real API calls (uncomment when backend is ready)
        // const [trendsResponse, statsResponse] = await Promise.all([
        //   axios.get('/api/admin/reports/attendance-trends'),
        //   axios.get('/api/admin/reports/course-stats')
        // ]);
        // setAttendanceTrends(trendsResponse.data);
        // setCourseStats(statsResponse.data);
        
        // Generate mock attendance data
        const mockAttendanceData = generateMockAttendanceData(150);
        setAllAttendanceData(mockAttendanceData);
        
        // Generate course stats from attendance data
        const generatedCourseStats = generateCourseStats(mockAttendanceData, courses);
        
        // Calculate overall attendance distribution
        const totalRecords = mockAttendanceData.length;
        const presentCount = mockAttendanceData.filter(record => record.status === 'present').length;
        const absentCount = mockAttendanceData.filter(record => record.status === 'absent').length;
        const lateCount = mockAttendanceData.filter(record => record.status === 'late').length;
        
        const calculatedPerformance = [
          { 
            name: "Present", 
            value: Math.round((presentCount / totalRecords) * 100),
            color: "#4caf50"
          },
          { 
            name: "Absent", 
            value: Math.round((absentCount / totalRecords) * 100),
            color: "#f44336"
          },
          { 
            name: "Late", 
            value: Math.round((lateCount / totalRecords) * 100),
            color: "#ff9800"
          }
        ];
        
        // Using mock data for development
        setAttendanceTrends(mockTrends);
        setCourseStats(generatedCourseStats.length > 0 ? generatedCourseStats : defaultCourseStats);
        setStudentPerformance(calculatedPerformance);
      } catch (apiErr) {
        console.warn('API calls failed, using mock data', apiErr);
        setAttendanceTrends(mockTrends);
        setCourseStats(defaultCourseStats);
        setStudentPerformance(mockStudentPerformance);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.msg || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Filter validation
      if (!filters.courseId && !filters.lecturerId && !filters.studentId && !filters.startDate && !filters.endDate) {
        setSnackbar({
          open: true,
          message: 'Please specify at least one filter',
          severity: 'warning'
        });
        setLoading(false);
        return;
      }

      // Apply filters to the attendance data 
      let filteredResults = [...allAttendanceData];
      
      // Apply course filter
      if (filters.courseId) {
        filteredResults = filteredResults.filter(record => 
          record.course._id === filters.courseId
        );
      }
      
      // Apply lecturer filter
      if (filters.lecturerId) {
        filteredResults = filteredResults.filter(record => 
          record.lecturer._id === filters.lecturerId
        );
      }
      
      // Apply student filter
      if (filters.studentId) {
        filteredResults = filteredResults.filter(record => 
          record.student._id === filters.studentId
        );
      }
      
      // Apply date filters
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filteredResults = filteredResults.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= startDate;
        });
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filteredResults = filteredResults.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate <= endDate;
        });
      }
      
      // Sort by date (newest first)
      filteredResults.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setReportData(filteredResults);
      
      if (filteredResults.length === 0) {
        setSnackbar({
          open: true,
          message: 'No records found matching the filter criteria',
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Found ${filteredResults.length} records matching the filter criteria`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report: ' + (error.response?.data?.msg || error.message));
      setSnackbar({
        open: true,
        message: 'Error generating report',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Implementation for exporting to CSV
    try {
      if (reportData.length === 0) {
        setSnackbar({
          open: true,
          message: 'No data to export',
          severity: 'warning'
        });
        return;
      }
      
      // Create CSV content
      const headers = ['Student', 'Course', 'Lecturer', 'Date', 'Status', 'Location'];
      const csvContent = [
        headers.join(','),
        ...reportData.map(record => [
          record.student?.name || 'N/A',
          record.course?.name || 'N/A',
          record.lecturer?.name || 'N/A',
          formatDate(record.date),
          record.status || 'N/A',
          record.location ? `${record.location.latitude}, ${record.location.longitude}` : 'N/A'
        ].join(','))
      ].join('\n');
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-report-${date}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'Report exported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      setSnackbar({
        open: true,
        message: 'Error exporting report',
        severity: 'error'
      });
    }
  };

  const generateSampleData = async () => {
    try {
      setGeneratingSamples(true);
      setSnackbar({
        open: true,
        message: 'Generating sample data...',
        severity: 'info'
      });
      
      // Real API call (uncomment when backend is ready)
      // await axios.post('/api/admin/generate-sample-data');
      
      // For development - simulate delay and refresh data
      await new Promise(resolve => setTimeout(resolve, 1500));
      await fetchData();
      
      setSnackbar({
        open: true,
        message: 'Sample data generated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error generating sample data:', err);
      setError('Failed to generate sample data');
      setSnackbar({
        open: true,
        message: 'Error generating sample data',
        severity: 'error'
      });
    } finally {
      setGeneratingSamples(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const clearFilters = () => {
    setFilters({
      courseId: '',
      lecturerId: '',
      studentId: '',
      startDate: '',
      endDate: '',
    });
    setSnackbar({
      open: true,
      message: 'Filters cleared',
      severity: 'info'
    });
  };

  if (loading && reportData.length === 0 && attendanceTrends.length === 0) {
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

      {error && <Alert severity="error" sx={{ mb:.2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Report Filters
              </Typography>
              <Button 
                variant="text" 
                color="primary" 
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Course"
                  value={filters.courseId}
                  onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
                >
                  <MenuItem key="all-courses" value="">All Courses</MenuItem>
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
                  <MenuItem key="all-lecturers" value="">All Lecturers</MenuItem>
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
                  <MenuItem key="all-students" value="">All Students</MenuItem>
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
                  inputProps={{
                    max: filters.endDate || undefined
                  }}
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
                  inputProps={{
                    min: filters.startDate || undefined
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={generateReport}
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Generate'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleExport}
                    fullWidth
                    disabled={reportData.length === 0}
                    startIcon={<FileDownloadIcon />}
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid container item xs={12} spacing={3}>
          {/* Attendance Trends Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Attendance Trends (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
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

          {/* Overall Attendance Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Overall Attendance Distribution
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={studentPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {studentPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={generateSampleData}
                disabled={generatingSamples}
              >
                {generatingSamples ? 'Generating...' : 'Refresh Data'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Report Results */}
        {reportData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Report Results ({reportData.length} records)
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExport}
                >
                  Export Results
                </Button>
              </Box>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Lecturer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{record.student?.name || 'N/A'}</TableCell>
                        <TableCell>{record.course?.name || 'N/A'}</TableCell>
                        <TableCell>{record.lecturer?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: 
                                record.status === 'present' ? 'rgba(76, 175, 80, 0.1)' :
                                record.status === 'absent' ? 'rgba(244, 67, 54, 0.1)' :
                                'rgba(255, 152, 0, 0.1)',
                              color: 
                                record.status === 'present' ? 'success.main' :
                                record.status === 'absent' ? 'error.main' :
                                'warning.main',
                              textTransform: 'capitalize'
                            }}
                          >
                            {record.status}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {record.location
                            ? `${record.location.latitude}, ${record.location.longitude}`
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default Reports; 