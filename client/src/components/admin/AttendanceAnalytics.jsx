import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Button,
  Tabs,
  Tab,
  Container,
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AttendanceAnalytics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeFrame, setTimeFrame] = useState('week');
  const [courseFilter, setCourseFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [facultyFilter, setFacultyFilter] = useState('all');
  
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  
  const [attendanceData, setAttendanceData] = useState({
    byProgram: [],
    byCourse: [],
    byDay: [],
    byTimeOfDay: [],
    studentPerformance: [],
    comparisonData: []
  });

  useEffect(() => {
    fetchFilters();
    fetchAttendanceData();
  }, [timeFrame, courseFilter, programFilter, facultyFilter]);

  const fetchFilters = async () => {
    try {
      // Fetch courses, programs, and faculties for filters
      const [coursesRes, programsRes, facultiesRes] = await Promise.all([
        axios.get('/api/admin/courses'),
        axios.get('/api/admin/programs'),
        axios.get('/api/admin/faculties')
      ]);
      
      setCourses(coursesRes.data);
      setPrograms(programsRes.data);
      setFaculties(facultiesRes.data);
    } catch (err) {
      console.error('Error fetching filters:', err);
      setError('Failed to load filter options. Please try again.');
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // In a real implementation, these would be API calls with proper filters
      // const response = await axios.get(`/api/admin/analytics/attendance?timeFrame=${timeFrame}&course=${courseFilter}&program=${programFilter}&faculty=${facultyFilter}`);
      
      // For demonstration, we'll use mock data
      setTimeout(() => {
        // Mock data for attendance by program
        const programAttendance = [
          { name: 'Computer Science', present: 85, absent: 15 },
          { name: 'Electrical Engineering', present: 78, absent: 22 },
          { name: 'Business Administration', present: 65, absent: 35 },
          { name: 'Mathematics', present: 92, absent: 8 },
          { name: 'Physics', present: 76, absent: 24 },
        ];
        
        // Mock data for attendance by course
        const courseAttendance = [
          { name: 'CSC101', present: 88, absent: 12 },
          { name: 'ENG201', present: 72, absent: 28 },
          { name: 'BUS305', present: 68, absent: 32 },
          { name: 'MAT112', present: 95, absent: 5 },
          { name: 'PHY203', present: 81, absent: 19 },
        ];
        
        // Mock data for attendance by day of week
        const dayAttendance = [
          { name: 'Monday', attendance: 78 },
          { name: 'Tuesday', attendance: 85 },
          { name: 'Wednesday', attendance: 91 },
          { name: 'Thursday', attendance: 76 },
          { name: 'Friday', attendance: 65 },
        ];
        
        // Mock data for attendance by time of day
        const timeAttendance = [
          { name: '8 AM', attendance: 62 },
          { name: '10 AM', attendance: 78 },
          { name: '12 PM', attendance: 85 },
          { name: '2 PM', attendance: 91 },
          { name: '4 PM', attendance: 73 },
        ];
        
        // Mock data for student attendance performance
        const studentPerformance = [
          { name: 'Top 10%', value: 98 },
          { name: '10-25%', value: 89 },
          { name: '25-50%', value: 78 },
          { name: '50-75%', value: 65 },
          { name: 'Bottom 25%', value: 45 },
        ];
        
        // Mock data for comparing attendance across different dimensions
        const comparisonData = [
          { name: 'Computer Science', thisWeek: 85, lastWeek: 82, twoWeeksAgo: 78 },
          { name: 'Engineering', thisWeek: 78, lastWeek: 75, twoWeeksAgo: 80 },
          { name: 'Business', thisWeek: 65, lastWeek: 68, twoWeeksAgo: 62 },
          { name: 'Arts', thisWeek: 72, lastWeek: 70, twoWeeksAgo: 75 },
        ];
        
        setAttendanceData({
          byProgram: programAttendance,
          byCourse: courseAttendance,
          byDay: dayAttendance,
          byTimeOfDay: timeAttendance,
          studentPerformance,
          comparisonData
        });
        
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance analytics. Please try again.');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Attendance Analytics
      </Typography>
      
      {error && (
        <Paper sx={{ p: 3, backgroundColor: '#ffebee' }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Paper>
      )}
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl variant="outlined" sx={{ minWidth: 150 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            label="Timeframe"
          >
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="semester">This Semester</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Course</InputLabel>
          <Select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            label="Course"
          >
            <MenuItem value="all">All Courses</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course._id} value={course._id}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Program Analysis" />
          <Tab label="Course Analysis" />
          <Tab label="Time Patterns" />
          <Tab label="Comparative View" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, height: 400, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Attendance by Program</Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                      data={attendanceData.byProgram}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" stackId="a" fill="#4CAF50" name="Present %" />
                      <Bar dataKey="absent" stackId="a" fill="#F44336" name="Absent %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: 400, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Student Performance Groups</Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={attendanceData.studentPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendanceData.studentPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Insights</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="primary">Highest Attendance</Typography>
                          <Typography variant="body1">Mathematics</Typography>
                          <Typography variant="h4">92%</Typography>
                          <Typography variant="body2" color="textSecondary">
                            8% above average
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="error">Lowest Attendance</Typography>
                          <Typography variant="body1">Business Administration</Typography>
                          <Typography variant="h4">65%</Typography>
                          <Typography variant="body2" color="textSecondary">
                            19% below average
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="textSecondary">Average Attendance</Typography>
                          <Typography variant="body1">All Programs</Typography>
                          <Typography variant="h4">84%</Typography>
                          <Typography variant="body2" color="textSecondary">
                            3% increase from last period
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, height: 400, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Attendance by Course</Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                      data={attendanceData.byCourse}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#4CAF50" name="Present %" />
                      <Bar dataKey="absent" fill="#F44336" name="Absent %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Course Attendance Details</Typography>
                  <Grid container spacing={2}>
                    {attendanceData.byCourse.map((course, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">{course.name}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="textSecondary">Present</Typography>
                                <Typography variant="h5">{course.present}%</Typography>
                              </Box>
                              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="textSecondary">Absent</Typography>
                                <Typography variant="h5">{course.absent}%</Typography>
                              </Box>
                            </Box>
                            <Button 
                              variant="outlined" 
                              fullWidth 
                              sx={{ mt: 2 }}
                              size="small"
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: 400, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Attendance by Day of Week</Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart
                      data={attendanceData.byDay}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="attendance" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: 400, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Attendance by Time of Day</Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart
                      data={attendanceData.byTimeOfDay}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="attendance" stroke="#82ca9d" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Time Patterns Analysis</Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Time-based analysis helps identify optimal scheduling for maximum attendance.
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="primary">Best Day</Typography>
                          <Typography variant="h4">Wednesday</Typography>
                          <Typography variant="body2" color="textSecondary">
                            91% attendance rate
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="primary">Best Time</Typography>
                          <Typography variant="h4">2 PM</Typography>
                          <Typography variant="body2" color="textSecondary">
                            91% attendance rate
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="error">Lowest Attendance</Typography>
                          <Typography variant="h4">Friday, 8 AM</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Consider rescheduling these sessions
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, height: 400, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Attendance Trends Over Time</Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                      data={attendanceData.comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="thisWeek" fill="#8884d8" name="This Week" />
                      <Bar dataKey="lastWeek" fill="#82ca9d" name="Last Week" />
                      <Bar dataKey="twoWeeksAgo" fill="#ffc658" name="Two Weeks Ago" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Attendance Improvement Suggestions</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="primary">Schedule Optimization</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Based on attendance patterns, consider moving Friday morning classes to Wednesday afternoon for a potential 26% attendance increase.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="primary">Course Engagement</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Business Administration courses show consistently lower attendance. Consider implementing interactive teaching methods to boost engagement.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="primary">Follow-up Actions</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Set up automatic notifications for students with attendance below 70% and schedule advisor meetings for those below 50%.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default AttendanceAnalytics; 