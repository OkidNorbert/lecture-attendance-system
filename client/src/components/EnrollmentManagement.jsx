import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SchoolIcon from '@mui/icons-material/School';

const EnrollmentManagement = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    lecturerId: '',
    programId: '',
    semester: '',
    programYear: 1,
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    status: 'enrolled'
  });
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resetAll, setResetAll] = useState(false);
  const [filters, setFilters] = useState({
    studentSearch: '',
    courseSearch: '',
    lecturerSearch: '',
    programId: '',
    semester: '',
    programYear: '',
    status: '',
    academicYear: ''
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkEnrollData, setBulkEnrollData] = useState({
    courseId: '',
    lecturerId: '',
    programId: '',
    semester: '',
    programYear: 1,
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    status: 'enrolled',
    students: []
  });
  // New state for admin features
  const [isAdmin, setIsAdmin] = useState(false);
  const [resetCourseDialogOpen, setResetCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [resetLecturerDialogOpen, setResetLecturerDialogOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [reassignLecturerDialogOpen, setReassignLecturerDialogOpen] = useState(false);
  const [reassignLecturerData, setReassignLecturerData] = useState({
    oldLecturerId: '',
    newLecturerId: '',
    courseId: '' // Optional, to limit to a specific course
  });

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchCourses();
    fetchLecturers();
    fetchPrograms();
    
    // Check if the current user is an admin
    const checkUserRole = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/me');
        console.log('Current user data:', response.data);
        const isUserAdmin = response.data.role === 'admin';
        console.log('Is user admin?', isUserAdmin);
        console.log('User role from API:', response.data.role);
        
        // Check local storage for comparison
        const storedRole = localStorage.getItem('userRole');
        console.log('User role in localStorage:', storedRole);
        
        // Log token information for debugging
        const token = localStorage.getItem('token');
        console.log('Token exists in localStorage:', !!token);
        if (token) {
          // Don't log the actual token for security reasons, just log that it exists
          console.log('Token length:', token.length);
          
          // Decode JWT token (only the payload which is not encrypted)
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedPayload = JSON.parse(window.atob(base64));
            console.log('Decoded token payload:', {
              role: decodedPayload.role,
              id: decodedPayload._id,
              exp: new Date(decodedPayload.exp * 1000).toLocaleString()
            });
          } catch (e) {
            console.error('Error decoding token:', e);
          }
        }
        
        setIsAdmin(isUserAdmin);
      } catch (err) {
        console.error('Error checking user role:', err);
      }
    };
    
    checkUserRole();
  }, []);

  useEffect(() => {
    if (!enrollments.length) {
      setFilteredEnrollments([]);
      return;
    }
    
    let filtered = [...enrollments];
    
    if (filters.studentSearch) {
      const search = filters.studentSearch.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const firstName = enrollment.student?.first_name?.toLowerCase() || '';
        const lastName = enrollment.student?.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`;
        const studentId = enrollment.student?.student_id?.toLowerCase() || '';
        return fullName.includes(search) || studentId.includes(search);
      });
    }
    
    if (filters.courseSearch) {
      const search = filters.courseSearch.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const courseName = enrollment.course?.course_name?.toLowerCase() || '';
        const courseCode = enrollment.course?.course_code?.toLowerCase() || '';
        return courseName.includes(search) || courseCode.includes(search);
      });
    }
    
    if (filters.lecturerSearch) {
      const search = filters.lecturerSearch.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const firstName = enrollment.lecturer?.first_name?.toLowerCase() || '';
        const lastName = enrollment.lecturer?.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`;
        return fullName.includes(search);
      });
    }
    
    if (filters.programId) {
      filtered = filtered.filter(enrollment => 
        enrollment.programId === filters.programId);
    }
    
    if (filters.semester) {
      filtered = filtered.filter(enrollment => 
        enrollment.semester === filters.semester);
    }
    
    if (filters.programYear) {
      filtered = filtered.filter(enrollment => 
        enrollment.programYear === Number(filters.programYear));
    }
    
    if (filters.status) {
      filtered = filtered.filter(enrollment => 
        enrollment.status === filters.status);
    }
    
    if (filters.academicYear) {
      filtered = filtered.filter(enrollment => 
        enrollment.academicYear === filters.academicYear);
    }
    
    setFilteredEnrollments(filtered);
  }, [enrollments, filters]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/enrollments');
      setEnrollments(response.data);
    } catch (err) {
      setError('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get('/api/users?role=student');
      setStudents(response.data);
    } catch (err) {
      setError('Failed to fetch students');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/api/courses');
      setCourses(response.data);
    } catch (err) {
      setError('Failed to fetch courses');
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await axiosInstance.get('/api/users?role=lecturer');
      setLecturers(response.data);
    } catch (err) {
      setError('Failed to fetch lecturers');
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axiosInstance.get('/api/programs');
      setPrograms(response.data);
    } catch (err) {
      setError('Failed to fetch programs');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Check if all required fields are present
      const requiredFields = ['studentId', 'courseId', 'lecturerId', 'programId', 'semester', 'programYear', 'academicYear'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Log the data being sent for debugging
      console.log('Enrollment request data:', formData);
      
      // Make the enrollment request
      const response = await axiosInstance.post('/api/enrollments', formData);
      console.log('Enrollment response:', response.data);
      
      setSuccess('Student enrolled successfully');
      setFormData({
        studentId: '',
        courseId: '',
        lecturerId: '',
        programId: '',
        semester: '',
        programYear: 1,
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        status: 'enrolled'
      });
      fetchEnrollments();
    } catch (err) {
      console.error('Enrollment error:', err);
      
      // Log more detailed error information
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
        userRole: isAdmin ? 'admin' : 'non-admin'
      });
      
      // Check for different error types
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 403) {
          setError('Access denied. You do not have permission to enroll students. Please check your account permissions.');
        } else if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
          // Optional: Redirect to login page
          // window.location.href = '/login';
        } else {
          setError(err.response.data?.message || 'Failed to enroll student');
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred while processing your request: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (enrollmentId, newStatus) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/api/enrollments/${enrollmentId}`, { status: newStatus });
      setSuccess('Enrollment status updated successfully');
      fetchEnrollments();
    } catch (err) {
      setError('Failed to update enrollment status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (enrollmentId) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/api/enrollments/${enrollmentId}`);
        setSuccess('Enrollment deleted successfully');
        fetchEnrollments();
      } catch (err) {
        setError('Failed to delete enrollment');
      } finally {
        setLoading(false);
      }
    }
  };

  const openResetDialog = (student = null) => {
    setSelectedStudent(student);
    setResetAll(!student);
    setResetDialogOpen(true);
  };

  const handleResetEnrollments = async () => {
    try {
      setLoading(true);
      const endpoint = resetAll 
        ? '/api/enrollments/reset-all'
        : `/api/enrollments/reset-student/${selectedStudent._id}`;
      
      await axiosInstance.post(endpoint);
      
      setSuccess(resetAll 
        ? 'All student enrollments have been reset' 
        : `Enrollments for ${selectedStudent.name || selectedStudent.first_name} have been reset`);
      
      fetchEnrollments();
      setResetDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      studentSearch: '',
      courseSearch: '',
      lecturerSearch: '',
      programId: '',
      semester: '',
      programYear: '',
      status: '',
      academicYear: ''
    });
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleBulkEnrollOpen = () => {
    setBulkEnrollOpen(true);
    handleMenuClose();
  };
  
  const handleBulkEnrollClose = () => {
    setBulkEnrollOpen(false);
  };

  // Group enrollments by student
  const groupedEnrollments = filteredEnrollments.reduce((acc, enrollment) => {
    const studentId = enrollment.studentId || (enrollment.student && enrollment.student._id);
    if (!studentId) return acc;
    
    if (!acc[studentId]) {
      acc[studentId] = {
        student: enrollment.student,
        enrollments: []
      };
    }
    acc[studentId].enrollments.push(enrollment);
    return acc;
  }, {});

  const handleBulkEnrollSubmit = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Validate required fields
      if (!bulkEnrollData.courseId || !bulkEnrollData.lecturerId || 
          !bulkEnrollData.programId || !bulkEnrollData.semester || 
          !bulkEnrollData.students.length) {
        setError('Please fill in all required fields and select at least one student');
        setLoading(false);
        return;
      }
      
      // Create an array of enrollment objects
      let successCount = 0;
      let failedCount = 0;
      const failedStudents = [];
      
      // Process enrollments one by one to catch individual errors
      for (const studentId of bulkEnrollData.students) {
        try {
          await axiosInstance.post('/api/enrollments', {
            studentId,
            courseId: bulkEnrollData.courseId,
            lecturerId: bulkEnrollData.lecturerId,
            programId: bulkEnrollData.programId,
            semester: bulkEnrollData.semester,
            programYear: bulkEnrollData.programYear,
            academicYear: bulkEnrollData.academicYear,
            status: bulkEnrollData.status
          });
          successCount++;
        } catch (err) {
          failedCount++;
          const student = students.find(s => s._id === studentId);
          const studentName = student ? `${student.first_name} ${student.last_name}` : studentId;
          failedStudents.push({
            id: studentId, 
            name: studentName,
            error: err.response?.data?.message || 'Unknown error'
          });
        }
      }
      
      // Show appropriate success/error message
      if (successCount > 0 && failedCount === 0) {
        setSuccess(`Successfully enrolled all ${successCount} students`);
        fetchEnrollments();
        handleBulkEnrollClose();
      } else if (successCount > 0 && failedCount > 0) {
        setSuccess(`Successfully enrolled ${successCount} students, but failed to enroll ${failedCount} students`);
        setError(`Failed to enroll the following students: ${failedStudents.map(s => s.name).join(', ')}`);
        fetchEnrollments();
      } else {
        setError(`Failed to enroll any students. Please check permissions and try again.`);
      }
      
      // Reset form
      setBulkEnrollData({
        courseId: '',
        lecturerId: '',
        programId: '',
        semester: '',
        programYear: 1,
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        status: 'enrolled',
        students: []
      });
      
    } catch (err) {
      console.error('Bulk enrollment error:', err);
      
      if (err.response) {
        if (err.response.status === 403) {
          setError('Access denied. You do not have permission to perform bulk enrollment.');
        } else if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else {
          setError(err.response.data?.message || 'Failed to enroll students. Check your permissions.');
        }
      } else if (err.request) {
        setError('No response from server. Please check your internet connection.');
      } else {
        setError('An error occurred: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEnrollChange = (e) => {
    const { name, value } = e.target;
    setBulkEnrollData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelectionChange = (e) => {
    setBulkEnrollData(prev => ({
      ...prev,
      students: e.target.value
    }));
  };

  // Reset enrollments for a specific course
  const openResetCourseDialog = (course) => {
    setSelectedCourse(course);
    setResetCourseDialogOpen(true);
  };
  
  const handleResetCourseEnrollments = async () => {
    try {
      setLoading(true);
      
      await axiosInstance.post(`/api/enrollments/reset-course/${selectedCourse._id}`);
      
      setSuccess(`Enrollments for course ${selectedCourse.course_name || selectedCourse.course_code} have been reset`);
      
      fetchEnrollments();
      setResetCourseDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset course enrollments');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset enrollments for a specific lecturer
  const openResetLecturerDialog = (lecturer) => {
    setSelectedLecturer(lecturer);
    setResetLecturerDialogOpen(true);
  };
  
  const handleResetLecturerEnrollments = async () => {
    try {
      setLoading(true);
      
      await axiosInstance.post(`/api/enrollments/reset-lecturer/${selectedLecturer._id}`);
      
      setSuccess(`Enrollments for lecturer ${selectedLecturer.name || selectedLecturer.first_name + ' ' + selectedLecturer.last_name} have been reset`);
      
      fetchEnrollments();
      setResetLecturerDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset lecturer enrollments');
    } finally {
      setLoading(false);
    }
  };
  
  // Reassign lecturer for enrollments
  const openReassignLecturerDialog = () => {
    setReassignLecturerData({
      oldLecturerId: '',
      newLecturerId: '',
      courseId: ''
    });
    setReassignLecturerDialogOpen(true);
    handleMenuClose();
  };
  
  const handleReassignLecturerChange = (e) => {
    const { name, value } = e.target;
    setReassignLecturerData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleReassignLecturer = async () => {
    try {
      setLoading(true);
      
      if (!reassignLecturerData.oldLecturerId || !reassignLecturerData.newLecturerId) {
        setError('Both original and new lecturer must be selected');
        setLoading(false);
        return;
      }
      
      const response = await axiosInstance.put('/api/enrollments/reassign-lecturer', reassignLecturerData);
      
      setSuccess(`Successfully reassigned ${response.data.count} enrollments`);
      
      fetchEnrollments();
      setReassignLecturerDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign lecturer enrollments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enrollment Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Controls bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6">
            Total Enrollments: {filteredEnrollments.length}
          </Typography>
          {Object.values(filters).some(Boolean) && (
            <Chip 
              label="Filtered" 
              color="primary" 
              size="small" 
              onDelete={resetFilters}
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleMenuOpen}
            startIcon={<MoreVertIcon />}
            sx={{ mr: 1 }}
          >
            Actions
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleBulkEnrollOpen}>
              <ListItemIcon>
                <FileUploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Bulk Enrollment</ListItemText>
            </MenuItem>
            
            {isAdmin && (
              <>
                <MenuItem onClick={openReassignLecturerDialog}>
                  <ListItemIcon>
                    <SwapHorizIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Reassign Lecturer</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => openResetDialog()}>
                  <ListItemIcon>
                    <RestartAltIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Reset All Enrollments</ListItemText>
                </MenuItem>
              </>
            )}
            
            {!isAdmin && (
              <MenuItem onClick={() => openResetDialog()}>
                <ListItemIcon>
                  <RestartAltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Reset All Enrollments</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Filter cards */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filters
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              name="studentSearch"
              label="Search Students"
              value={filters.studentSearch}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              name="courseSearch"
              label="Search Courses"
              value={filters.courseSearch}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              name="lecturerSearch"
              label="Search Lecturers"
              value={filters.lecturerSearch}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Program</InputLabel>
              <Select
                name="programId"
                value={filters.programId}
                onChange={handleFilterChange}
                label="Program"
              >
                <MenuItem value="">All Programs</MenuItem>
                {programs.map(program => (
                  <MenuItem key={program._id} value={program._id}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                label="Semester"
              >
                <MenuItem value="">All Semesters</MenuItem>
                <MenuItem value="1">1st Semester</MenuItem>
                <MenuItem value="2">2nd Semester</MenuItem>
                <MenuItem value="Summer">Summer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                name="programYear"
                value={filters.programYear}
                onChange={handleFilterChange}
                label="Year"
              >
                <MenuItem value="">All Years</MenuItem>
                <MenuItem value="1">1st Year</MenuItem>
                <MenuItem value="2">2nd Year</MenuItem>
                <MenuItem value="3">3rd Year</MenuItem>
                <MenuItem value="4">4th Year</MenuItem>
                <MenuItem value="5">5th Year</MenuItem>
                <MenuItem value="6">6th Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="enrolled">Enrolled</MenuItem>
                <MenuItem value="dropped">Dropped</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              name="academicYear"
              label="Academic Year"
              value={filters.academicYear}
              onChange={handleFilterChange}
              placeholder="e.g., 2023-2024"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="outlined" 
              onClick={resetFilters}
              disabled={!Object.values(filters).some(Boolean)}
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Enroll Student
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name || `${student.first_name} ${student.last_name}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
              >
                {courses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.course_code} - {course.course_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Lecturer</InputLabel>
              <Select
                name="lecturerId"
                value={formData.lecturerId}
                onChange={handleChange}
                required
              >
                {lecturers.map((lecturer) => (
                  <MenuItem key={lecturer._id} value={lecturer._id}>
                    {lecturer.name || `${lecturer.first_name} ${lecturer.last_name}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Program</InputLabel>
              <Select
                name="programId"
                value={formData.programId}
                onChange={handleChange}
                required
              >
                {programs.map((program) => (
                  <MenuItem key={program._id} value={program._id}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="semester"
              label="Semester"
              value={formData.semester}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              name="programYear"
              label="Program Year"
              type="number"
              value={formData.programYear}
              onChange={handleChange}
              required
              fullWidth
              inputProps={{ min: 1, max: 6 }}
            />

            <TextField
              name="academicYear"
              label="Academic Year"
              value={formData.academicYear}
              onChange={handleChange}
              required
              fullWidth
              placeholder="e.g., 2023-2024"
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <MenuItem value="enrolled">Enrolled</MenuItem>
                <MenuItem value="dropped">Dropped</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Enroll Student'}
          </Button>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Enrollments
        </Typography>
        
        {/* Student Groupings */}
        {Object.entries(groupedEnrollments).length > 0 ? (
          Object.entries(groupedEnrollments).map(([studentId, { student, enrollments: studentEnrollments }]) => (
            <Box key={studentId} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, bgcolor: 'primary.light', p: 1, borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="white">
                  Student: {student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`}
                </Typography>
                <Tooltip title="Reset Student Enrollments">
                  <IconButton 
                    color="inherit" 
                    size="small" 
                    onClick={() => openResetDialog(student)}
                    sx={{ ml: 2 }}
                  >
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell>Lecturer</TableCell>
                      <TableCell>Program</TableCell>
                      <TableCell>Semester</TableCell>
                      <TableCell>Academic Year</TableCell>
                      <TableCell>Year</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentEnrollments.map((enrollment) => (
                      <TableRow key={enrollment._id}>
                        <TableCell>
                          {enrollment.course?.course_code} - {enrollment.course?.course_name}
                        </TableCell>
                        <TableCell>{enrollment.lecturer?.name || `${enrollment.lecturer?.first_name || ''} ${enrollment.lecturer?.last_name || ''}`}</TableCell>
                        <TableCell>{enrollment.program?.name}</TableCell>
                        <TableCell>{enrollment.semester}</TableCell>
                        <TableCell>{enrollment.academicYear || 'N/A'}</TableCell>
                        <TableCell>{enrollment.programYear}</TableCell>
                        <TableCell>
                          <Select
                            value={enrollment.status}
                            onChange={(e) => handleStatusChange(enrollment._id, e.target.value)}
                            size="small"
                            sx={{ minWidth: 120 }}
                          >
                            <MenuItem value="enrolled">Enrolled</MenuItem>
                            <MenuItem value="dropped">Dropped</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Delete Enrollment">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(enrollment._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {isAdmin && (
                            <>
                              <Tooltip title="Reset Course Enrollments">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => openResetCourseDialog(enrollment.course)}
                                >
                                  <SchoolIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reset Lecturer Enrollments">
                                <IconButton
                                  color="secondary"
                                  size="small"
                                  onClick={() => openResetLecturerDialog(enrollment.lecturer)}
                                >
                                  <SwapHorizIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))
        ) : (
          <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
            No enrollments found
          </Typography>
        )}
      </Paper>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>
          {resetAll ? 'Reset All Enrollments' : 'Reset Student Enrollments'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {resetAll 
              ? 'Are you sure you want to reset all student enrollments? This action cannot be undone.'
              : `Are you sure you want to reset all enrollments for ${selectedStudent?.name || selectedStudent?.first_name || 'this student'}? This action cannot be undone.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleResetEnrollments} color="error" variant="contained">
            Reset Enrollments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Enrollment Dialog */}
      <Dialog 
        open={bulkEnrollOpen} 
        onClose={handleBulkEnrollClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Bulk Enrollment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select multiple students to enroll in a single course.
          </DialogContentText>
          
          {/* Bulk enrollment form here */}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="bulk-students-label">Select Students</InputLabel>
                  <Select
                    labelId="bulk-students-label"
                    multiple
                    name="students"
                    value={bulkEnrollData.students}
                    onChange={handleStudentSelectionChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((studentId) => {
                          const student = students.find(s => s._id === studentId);
                          return (
                            <Chip 
                              key={studentId} 
                              label={student ? (student.name || `${student.first_name} ${student.last_name}`) : 'Student'} 
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {students.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name || `${student.first_name} ${student.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Course</InputLabel>
                  <Select
                    name="courseId"
                    value={bulkEnrollData.courseId}
                    onChange={handleBulkEnrollChange}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course._id} value={course._id}>
                        {course.course_code} - {course.course_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Lecturer</InputLabel>
                  <Select
                    name="lecturerId"
                    value={bulkEnrollData.lecturerId}
                    onChange={handleBulkEnrollChange}
                  >
                    {lecturers.map((lecturer) => (
                      <MenuItem key={lecturer._id} value={lecturer._id}>
                        {lecturer.name || `${lecturer.first_name} ${lecturer.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Program</InputLabel>
                  <Select
                    name="programId"
                    value={bulkEnrollData.programId}
                    onChange={handleBulkEnrollChange}
                  >
                    {programs.map((program) => (
                      <MenuItem key={program._id} value={program._id}>
                        {program.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="semester"
                  label="Semester"
                  value={bulkEnrollData.semester}
                  onChange={handleBulkEnrollChange}
                  required
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="programYear"
                  label="Program Year"
                  type="number"
                  value={bulkEnrollData.programYear}
                  onChange={handleBulkEnrollChange}
                  required
                  fullWidth
                  inputProps={{ min: 1, max: 6 }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="academicYear"
                  label="Academic Year"
                  value={bulkEnrollData.academicYear}
                  onChange={handleBulkEnrollChange}
                  required
                  fullWidth
                  placeholder="e.g., 2023-2024"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={bulkEnrollData.status}
                    onChange={handleBulkEnrollChange}
                  >
                    <MenuItem value="enrolled">Enrolled</MenuItem>
                    <MenuItem value="dropped">Dropped</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkEnrollClose}>Cancel</Button>
          <Button 
            variant="contained" 
            disabled={loading || bulkEnrollData.students.length === 0}
            onClick={handleBulkEnrollSubmit}
          >
            {loading ? <CircularProgress size={24} /> : `Enroll ${bulkEnrollData.students.length} Student(s)`}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Course Dialog */}
      {isAdmin && (
        <Dialog 
          open={resetCourseDialogOpen} 
          onClose={() => setResetCourseDialogOpen(false)}
        >
          <DialogTitle>Reset Course Enrollments</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {selectedCourse 
                ? `Are you sure you want to reset all enrollments for course ${selectedCourse.course_name || selectedCourse.course_code}? This action cannot be undone.`
                : 'Are you sure you want to reset all enrollments for this course? This action cannot be undone.'
              }
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetCourseDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleResetCourseEnrollments} color="error" variant="contained">
              Reset Course Enrollments
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Reset Lecturer Dialog */}
      {isAdmin && (
        <Dialog 
          open={resetLecturerDialogOpen} 
          onClose={() => setResetLecturerDialogOpen(false)}
        >
          <DialogTitle>Reset Lecturer Enrollments</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {selectedLecturer 
                ? `Are you sure you want to reset all enrollments for courses taught by ${selectedLecturer.name || selectedLecturer.first_name + ' ' + selectedLecturer.last_name}? This action cannot be undone.`
                : 'Are you sure you want to reset all enrollments for courses taught by this lecturer? This action cannot be undone.'
              }
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetLecturerDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleResetLecturerEnrollments} color="error" variant="contained">
              Reset Lecturer Enrollments
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Reassign Lecturer Dialog */}
      {isAdmin && (
        <Dialog 
          open={reassignLecturerDialogOpen} 
          onClose={() => setReassignLecturerDialogOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Reassign Lecturer Enrollments</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Reassign enrollments from one lecturer to another. You can optionally limit the reassignment to a specific course.
            </DialogContentText>
            
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Original Lecturer</InputLabel>
                    <Select
                      name="oldLecturerId"
                      value={reassignLecturerData.oldLecturerId}
                      onChange={handleReassignLecturerChange}
                    >
                      {lecturers.map((lecturer) => (
                        <MenuItem key={lecturer._id} value={lecturer._id}>
                          {lecturer.name || `${lecturer.first_name} ${lecturer.last_name}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>New Lecturer</InputLabel>
                    <Select
                      name="newLecturerId"
                      value={reassignLecturerData.newLecturerId}
                      onChange={handleReassignLecturerChange}
                    >
                      {lecturers.map((lecturer) => (
                        <MenuItem key={lecturer._id} value={lecturer._id}>
                          {lecturer.name || `${lecturer.first_name} ${lecturer.last_name}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Limit to Course (Optional)</InputLabel>
                    <Select
                      name="courseId"
                      value={reassignLecturerData.courseId}
                      onChange={handleReassignLecturerChange}
                      displayEmpty
                    >
                      <MenuItem value="">All Courses</MenuItem>
                      {courses.map((course) => (
                        <MenuItem key={course._id} value={course._id}>
                          {course.course_code} - {course.course_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReassignLecturerDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              disabled={loading || !reassignLecturerData.oldLecturerId || !reassignLecturerData.newLecturerId}
              onClick={handleReassignLecturer}
            >
              {loading ? <CircularProgress size={24} /> : 'Reassign Enrollments'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default EnrollmentManagement; 