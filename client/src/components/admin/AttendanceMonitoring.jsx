import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import axios from 'axios';
import Reports from './Reports'; // Import the Reports component

// TabPanel component for switching between tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `attendance-tab-${index}`,
    'aria-controls': `attendance-tabpanel-${index}`,
  };
}

const AttendanceMonitoring = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState({
    course: '',
    student: '',
    date: ''
  });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/admin/attendance',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      console.log('Attendance records:', response.data); // Debug log
      setRecords(response.data);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError(err.response?.data?.msg || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field) => (event) => {
    setFilter({ ...filter, [field]: event.target.value });
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredRecords = records.filter(record => {
    return (
      (!filter.course || record.courseId?.code?.toLowerCase().includes(filter.course.toLowerCase())) &&
      (!filter.student || record.studentId?.name?.toLowerCase().includes(filter.student.toLowerCase())) &&
      (!filter.date || new Date(record.date).toLocaleDateString().includes(filter.date))
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Attendance Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="attendance management tabs"
          sx={{ mb: 2 }}
        >
          <Tab label="Attendance Monitoring" {...a11yProps(0)} />
          <Tab label="Attendance Reports" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Course Filter"
              value={filter.course}
              onChange={handleFilterChange('course')}
              size="small"
            />
            <TextField
              label="Student Filter"
              value={filter.student}
              onChange={handleFilterChange('student')}
              size="small"
            />
            <TextField
              label="Date Filter"
              value={filter.date}
              onChange={handleFilterChange('date')}
              size="small"
              placeholder="MM/DD/YYYY"
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Lecturer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Check-in Time</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecords
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>
                            {new Date(record.date).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {record.courseId?.code}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {record.courseId?.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {record.studentId?.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {record.studentId?.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {record.lecturerId?.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {record.lecturerId?.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color: record.status === 'present' ? 'success.main' : 'error.main',
                                fontWeight: 'bold'
                              }}
                            >
                              {record.status?.toUpperCase()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {record.checkInTime ? 
                              new Date(record.checkInTime).toLocaleTimeString() : 
                              'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            {record.location || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredRecords.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Reports />
      </TabPanel>
    </Box>
  );
};

export default AttendanceMonitoring; 