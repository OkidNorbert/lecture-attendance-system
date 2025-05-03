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
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Stack,
  IconButton,
  Tooltip,
  Autocomplete
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const LecturerCourseEnrollment = () => {
  const theme = useTheme();
  const [lecturerEnrollments, setLecturerEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollFormData, setEnrollFormData] = useState({
    courses: [],
    semester: '',
    programYear: 1,
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [filters, setFilters] = useState({
    lecturerSearch: '',
    courseSearch: '',
    programId: '',
  });
  const [enrollmentToDelete, setEnrollmentToDelete] = useState(null);
  const [multiEnrollData, setMultiEnrollData] = useState({
    lecturerId: '',
    courses: [],
    academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
  });
  const [multiEnrollDialogOpen, setMultiEnrollDialogOpen] = useState(false);

  useEffect(() => {
    fetchLecturers();
    fetchCourses();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedLecturer) {
      fetchLecturerEnrollments(selectedLecturer._id);
    } else {
      setLecturerEnrollments([]);
    }
  }, [selectedLecturer]);

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/users?role=lecturer');
      setLecturers(response.data);
    } catch (err) {
      console.error('Error fetching lecturers:', err);
      setError('Failed to fetch lecturers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/api/courses');
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses');
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/programs');
      setPrograms(response.data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to fetch programs');
    }
  };

  const fetchLecturerEnrollments = async (lecturerId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/admin/lecturers/${lecturerId}/enrollments`);
      setLecturerEnrollments(response.data);
      
      // Update available courses by filtering out already enrolled courses
      updateAvailableCourses(response.data);
    } catch (err) {
      console.error('Error fetching lecturer enrollments:', err);
      setError('Failed to fetch lecturer enrollments');
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableCourses = (enrollments) => {
    // Get IDs of courses the lecturer is already enrolled in
    const enrolledCourseIds = enrollments.map(enrollment => enrollment.course?.id);
    
    // Filter available courses to exclude already enrolled courses
    const available = courses.filter(course => !enrolledCourseIds.includes(course._id || course.id));
    setAvailableCourses(available);
  };

  const handleLecturerChange = (lecturer) => {
    setSelectedLecturer(lecturer);
    setError('');
    setSuccess('');
  };

  const handleOpenEnrollDialog = () => {
    // Reset form data
    setEnrollFormData({
      courses: [],
      semester: '',
      programYear: 1,
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    });
    setEnrollDialogOpen(true);
  };

  const handleCloseEnrollDialog = () => {
    setEnrollDialogOpen(false);
  };

  const handleEnrollFormChange = (e) => {
    const { name, value } = e.target;
    setEnrollFormData({
      ...enrollFormData,
      [name]: value
    });
  };

  const handleCourseSelection = (event, selectedCourses) => {
    setEnrollFormData({
      ...enrollFormData,
      courses: selectedCourses
    });
  };

  const handleEnrollLecturer = async () => {
    if (!selectedLecturer || enrollFormData.courses.length === 0) {
      setError('Please select a lecturer and at least one course');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Format the courses data for the API
      const coursesData = enrollFormData.courses.map(course => ({
        courseId: course._id || course.id,
        programId: course.program_id || course.programId || course.program?.id,
        semester: enrollFormData.semester || course.semester,
        programYear: parseInt(enrollFormData.programYear) || course.programYear,
        academicYear: enrollFormData.academicYear
      }));

      const response = await axiosInstance.post(`/api/admin/lecturers/${selectedLecturer._id}/enroll`, {
        courses: coursesData
      });

      setSuccess(`Successfully enrolled lecturer in ${response.data.enrollments.length} courses`);
      handleCloseEnrollDialog();
      fetchLecturerEnrollments(selectedLecturer._id);
    } catch (err) {
      console.error('Error enrolling lecturer:', err);
      setError(err.response?.data?.msg || 'Failed to enroll lecturer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = (enrollmentId, courseName) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Course Assignment',
      message: `Are you sure you want to remove ${selectedLecturer.first_name} ${selectedLecturer.last_name} from the course "${courseName}"?`,
      onConfirm: () => confirmDeleteEnrollment(enrollmentId)
    });
  };

  const confirmDeleteEnrollment = async (enrollmentId) => {
    try {
      setLoading(true);
      const courseId = lecturerEnrollments.find(e => e._id === enrollmentId)?.course?.id;
      
      await axiosInstance.delete(`/api/admin/lecturers/${selectedLecturer._id}/enroll/${courseId}`);
      
      setSuccess('Lecturer enrollment removed successfully');
      fetchLecturerEnrollments(selectedLecturer._id);
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      setError(err.response?.data?.msg || 'Failed to remove lecturer enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Filter lecturer enrollments based on search criteria
  const filteredEnrollments = lecturerEnrollments.filter(enrollment => {
    const lecturerName = `${enrollment.lecturer?.first_name} ${enrollment.lecturer?.last_name}`.toLowerCase();
    const courseName = `${enrollment.course?.course_code} ${enrollment.course?.course_name}`.toLowerCase();
    
    return (
      (!filters.lecturerSearch || lecturerName.includes(filters.lecturerSearch.toLowerCase())) &&
      (!filters.courseSearch || courseName.includes(filters.courseSearch.toLowerCase())) &&
      (!filters.programId || enrollment.course?.program?._id === filters.programId)
    );
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      lecturerSearch: '',
      courseSearch: '',
      programId: '',
    });
  };

  // Handle deletion
  const handleDelete = (enrollmentId) => {
    const enrollment = lecturerEnrollments.find(e => e._id === enrollmentId);
    setEnrollmentToDelete(enrollment);
    setConfirmDialog({
      open: true,
      title: 'Remove Course Assignment',
      message: `Are you sure you want to remove ${enrollment.lecturer?.first_name} ${enrollment.lecturer?.last_name} from the course "${enrollment.course?.course_name}"?`,
      onConfirm: () => confirmDeleteEnrollment(enrollmentId)
    });
  };

  // Confirm deletion
  const confirmDelete = async (enrollmentId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/api/admin/lecturers/${selectedLecturer._id}/enroll/${enrollmentId}`);
      
      setSuccess('Lecturer enrollment removed successfully');
      fetchLecturerEnrollments(selectedLecturer._id);
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      setError(err.response?.data?.msg || 'Failed to remove lecturer enrollment');
    } finally {
      setLoading(false);
    }
  };

  // Handle multi-course enrollment
  const handleMultiEnrollChange = (e) => {
    const { name, value } = e.target;
    setMultiEnrollData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle course selection for multi-enrollment
  const handleCourseSelectionChange = (e) => {
    setMultiEnrollData(prev => ({ ...prev, courses: e.target.value }));
  };
  
  // Open multi-enroll dialog
  const openMultiEnrollDialog = () => {
    setMultiEnrollDialogOpen(true);
  };
  
  // Close multi-enroll dialog
  const closeMultiEnrollDialog = () => {
    setMultiEnrollDialogOpen(false);
  };
  
  // Submit multi-course enrollment
  const handleMultiEnrollSubmit = async () => {
    if (!multiEnrollData.lecturerId || multiEnrollData.courses.length === 0) return;
    
    setLoading(true);
    try {
      await axiosInstance.post(`/api/admin/lecturers/${multiEnrollData.lecturerId}/enroll-multiple`, {
        courseIds: multiEnrollData.courses,
        academicYear: multiEnrollData.academicYear,
      });
      
      setSuccess(`Lecturer successfully enrolled in ${multiEnrollData.courses.length} courses.`);
      setMultiEnrollData({
        lecturerId: '',
        courses: [],
        academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
      });
      
      // Refresh lecturer enrollments
      fetchLecturerEnrollments(multiEnrollData.lecturerId);
      closeMultiEnrollDialog();
    } catch (err) {
      setError('Failed to enroll lecturer in multiple courses: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Lecturer Course Enrollment Management
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {(success || error) && (
        <Box sx={{ mb: 2 }}>
          {success && <Alert severity="success">{success}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Select Lecturer</Typography>
        <Autocomplete
          options={lecturers}
          getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
          value={selectedLecturer}
          onChange={(event, newValue) => handleLecturerChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Lecturer"
              variant="outlined"
              fullWidth
            />
          )}
          sx={{ mb: 2 }}
        />
      </Paper>
      
      {selectedLecturer && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Courses for {selectedLecturer.first_name} {selectedLecturer.last_name}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenEnrollDialog}
            >
              Assign Courses
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : lecturerEnrollments.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.primary.main }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white' }}>Course</TableCell>
                    <TableCell sx={{ color: 'white' }}>Program</TableCell>
                    <TableCell sx={{ color: 'white' }}>Semester</TableCell>
                    <TableCell sx={{ color: 'white' }}>Program Year</TableCell>
                    <TableCell sx={{ color: 'white' }}>Academic Year</TableCell>
                    <TableCell sx={{ color: 'white' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lecturerEnrollments.map((enrollment) => (
                    <TableRow key={enrollment._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BookIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                          <Box>
                            <Typography variant="body1">{enrollment.course?.name}</Typography>
                            <Typography variant="body2" color="textSecondary">{enrollment.course?.code}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{enrollment.program?.name}</TableCell>
                      <TableCell>{enrollment.semester}</TableCell>
                      <TableCell>{enrollment.programYear}</TableCell>
                      <TableCell>{enrollment.academicYear}</TableCell>
                      <TableCell>
                        <Chip
                          label={enrollment.status}
                          color={enrollment.status === 'enrolled' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Remove Course Assignment">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(enrollment._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No courses assigned to this lecturer yet.
              </Typography>
            </Paper>
          )}
        </>
      )}
      
      {/* Enroll Dialog */}
      <Dialog open={enrollDialogOpen} onClose={handleCloseEnrollDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Assign Courses to {selectedLecturer?.first_name} {selectedLecturer?.last_name}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select the courses you want to assign to this lecturer.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={availableCourses}
                getOptionLabel={(option) => `${option.course_name || option.name} (${option.course_code || option.code})`}
                value={enrollFormData.courses}
                onChange={handleCourseSelection}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Courses"
                    variant="outlined"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">{option.course_name || option.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {option.course_code || option.code} | Program: {option.program?.name || "N/A"}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Semester"
                name="semester"
                value={enrollFormData.semester}
                onChange={handleEnrollFormChange}
                variant="outlined"
                placeholder="e.g., 1, 2, Summer"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Program Year"
                name="programYear"
                type="number"
                value={enrollFormData.programYear}
                onChange={handleEnrollFormChange}
                variant="outlined"
                inputProps={{ min: 1, max: 6 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Academic Year"
                name="academicYear"
                value={enrollFormData.academicYear}
                onChange={handleEnrollFormChange}
                variant="outlined"
                placeholder="e.g., 2023-2024"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEnrollDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleEnrollLecturer} 
            color="primary" 
            variant="contained"
            disabled={loading || enrollFormData.courses.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : "Assign Courses"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDialog.onConfirm} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LecturerCourseEnrollment; 