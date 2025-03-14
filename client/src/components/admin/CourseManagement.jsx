import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
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
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Grid,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
    departmentId: '',
    programId: '',
    description: '',
    credits: '',
    status: 'active'
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchFaculties(),
        fetchDepartments(),
        fetchPrograms(),
        fetchCourses()
      ]);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Fetched courses:', response.data); // Debug log
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses');
    }
  };

  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/faculties', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFaculties(response.data);
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setError('Failed to fetch faculties');
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to fetch departments');
    }
  };

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/programs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPrograms(response.data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to fetch programs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setValidationErrors({});

    // Validate all required fields
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Course name is required';
    if (!formData.code.trim()) errors.code = 'Course code is required';
    if (!formData.facultyId) errors.facultyId = 'Faculty is required';
    if (!formData.departmentId) errors.departmentId = 'Department is required';
    if (!formData.programId) errors.programId = 'Program is required';
    if (!formData.credits) errors.credits = 'Credits are required';

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const courseData = {
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
        facultyId: formData.facultyId,
        departmentId: formData.departmentId,
        programId: formData.programId,
        description: formData.description?.trim() || '',
        credits: Number(formData.credits),
        status: formData.status || 'active'
      };

      // Debug log the data being sent
      console.log('Submitting course data:', courseData);

      const response = await axios.post(
        'http://localhost:5000/api/admin/courses',
        courseData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Debug log the response
      console.log('Server response:', response.data);

      // Update courses list and show success message
      setCourses([...courses, response.data]);
      setSuccessMessage('Course added successfully');
      resetForm();
    } catch (err) {
      console.error('Create course error:', err.response?.data || err);
      setError(err.response?.data?.msg || 'Error adding course');
      
      // If server returned validation errors, set them
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/admin/courses/${selectedCourse._id}`,
        formData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setCourses(courses.map(course => 
        course._id === selectedCourse._id ? response.data : course
      ));
      setSuccessMessage('Course updated successfully');
      setOpenDialog(false);
      setSelectedCourse(null);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/api/admin/courses/${courseId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setCourses(courses.filter(course => course._id !== courseId));
      setSuccessMessage(response.data.msg);
    } catch (err) {
      console.error('Delete course error:', err.response?.data || err);
      setError(err.response?.data?.msg || 'Error deleting course');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      facultyId: '',
      departmentId: '',
      programId: '',
      description: '',
      credits: '',
      status: 'active'
    });
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      facultyId: course.facultyId?._id || '',
      departmentId: course.departmentId?._id || '',
      programId: course.programId?._id || '',
      description: course.description || '',
      credits: course.credits,
      status: course.status
    });
    setOpenDialog(true);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Add Course Form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add New Course
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Name"
                    placeholder="e.g., Object Oriented Programming"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setValidationErrors({ ...validationErrors, name: '' });
                    }}
                    required
                    error={!!validationErrors.name}
                    helperText={validationErrors.name || ""}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Code"
                    placeholder="e.g., CSC001"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value });
                      setValidationErrors({ ...validationErrors, code: '' });
                    }}
                    required
                    error={!!validationErrors.code}
                    helperText={validationErrors.code || "Enter course code (e.g., CSC001)"}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required error={!!validationErrors.facultyId}>
                    <InputLabel>Faculty</InputLabel>
                    <Select
                      value={formData.facultyId}
                      label="Faculty"
                      onChange={(e) => {
                        setFormData({ ...formData, facultyId: e.target.value });
                        setValidationErrors({ ...validationErrors, facultyId: '' });
                      }}
                    >
                      {faculties.map((faculty) => (
                        <MenuItem key={faculty._id} value={faculty._id}>
                          {faculty.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {validationErrors.facultyId && (
                      <FormHelperText error>{validationErrors.facultyId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required error={!!validationErrors.departmentId}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={formData.departmentId}
                      label="Department"
                      onChange={(e) => {
                        setFormData({ ...formData, departmentId: e.target.value });
                        setValidationErrors({ ...validationErrors, departmentId: '' });
                      }}
                    >
                      {departments.map((department) => (
                        <MenuItem key={department._id} value={department._id}>
                          {department.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {validationErrors.departmentId && (
                      <FormHelperText error>{validationErrors.departmentId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required error={!!validationErrors.programId}>
                    <InputLabel>Program</InputLabel>
                    <Select
                      value={formData.programId}
                      label="Program"
                      onChange={(e) => {
                        setFormData({ ...formData, programId: e.target.value });
                        setValidationErrors({ ...validationErrors, programId: '' });
                      }}
                    >
                      {programs.map((program) => (
                        <MenuItem key={program._id} value={program._id}>
                          {program.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {validationErrors.programId && (
                      <FormHelperText error>{validationErrors.programId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Credits"
                    type="number"
                    value={formData.credits}
                    onChange={(e) => {
                      setFormData({ ...formData, credits: e.target.value });
                      setValidationErrors({ ...validationErrors, credits: '' });
                    }}
                    required
                    error={!!validationErrors.credits}
                    helperText={validationErrors.credits || "Credits (1-25)"}
                    inputProps={{ min: 1, max: 25 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Add Course'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Courses List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Courses List
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : courses.length === 0 ? (
              <Typography color="textSecondary" align="center">
                No courses found
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {courses.map((course) => (
                  <Grid item xs={12} key={course._id}>
                    <Paper sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" component="h3">
                              {course.name}
                            </Typography>
                            <Typography variant="subtitle2" color="primary">
                              Code: {course.code}
                            </Typography>
                          </Box>
                          <Box>
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEdit(course)}
                                sx={{ color: 'primary.main' }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDelete(course._id)}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            Faculty: {course.facultyId?.name}
                          </Typography>
                          <Typography variant="body2">
                            Department: {course.departmentId?.name}
                          </Typography>
                          <Typography variant="body2">
                            Program: {course.programId?.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            Credits: {course.credits}
                          </Typography>
                          <Typography variant="body2">
                            Status: {course.status}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {course.description}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setSelectedCourse(null);
        resetForm();
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Course
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Course Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Course Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Faculty</InputLabel>
              <Select
                value={formData.facultyId}
                label="Faculty"
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
              >
                {faculties.map((faculty) => (
                  <MenuItem key={faculty._id} value={faculty._id}>
                    {faculty.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.departmentId}
                label="Department"
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                {departments.map((department) => (
                  <MenuItem key={department._id} value={department._id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Program</InputLabel>
              <Select
                value={formData.programId}
                label="Program"
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
              >
                {programs.map((program) => (
                  <MenuItem key={program._id} value={program._id}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Credits"
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
              required
              inputProps={{ min: 1, max: 25 }}
              helperText="Credits (1-25)"
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              setSelectedCourse(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement;