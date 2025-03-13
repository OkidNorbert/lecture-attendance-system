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
    semester: '',
    academicYear: '',
    status: 'active'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCourses(),
        fetchFaculties(),
        fetchDepartments(),
        fetchPrograms()
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
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
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
      setError('Failed to load faculties');
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
      setError('Failed to load departments');
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
      setError('Failed to load programs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/admin/courses',
        formData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setCourses([...courses, response.data]);
      setSuccessMessage('Course created successfully');
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating course');
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
      resetForm();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/courses/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setCourses(courses.filter(course => course._id !== id));
      setSuccessMessage('Course deleted successfully');
    } catch (err) {
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
      semester: '',
      academicYear: '',
      status: 'active'
    });
    setSelectedCourse(null);
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      facultyId: course.facultyId._id,
      departmentId: course.departmentId._id,
      programId: course.programId._id,
      description: course.description,
      credits: course.credits,
      semester: course.semester,
      academicYear: course.academicYear,
      status: course.status
    });
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Course Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => {
          resetForm();
          setOpenDialog(true);
        }}
        sx={{ mb: 3 }}
      >
        Add Course
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Program</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course._id}>
                <TableCell>{course.code}</TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell>{course.facultyId?.name}</TableCell>
                <TableCell>{course.departmentId?.name}</TableCell>
                <TableCell>{course.programId?.name}</TableCell>
                <TableCell>{course.credits}</TableCell>
                <TableCell>{course.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(course)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(course._id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCourse ? 'Edit Course' : 'Add Course'}
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
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
              fullWidth
              inputProps={{ min: 1, max: 6 }}
            />
            <FormControl fullWidth required>
              <InputLabel>Semester</InputLabel>
              <Select
                value={formData.semester}
                label="Semester"
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <MenuItem value="Fall">Fall</MenuItem>
                <MenuItem value="Spring">Spring</MenuItem>
                <MenuItem value="Summer">Summer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Academic Year"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              required
              fullWidth
              placeholder="YYYY-YYYY"
            />
            <FormControl fullWidth required>
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={selectedCourse ? handleUpdate : handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : selectedCourse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement;