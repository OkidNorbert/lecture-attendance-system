import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: '',
    year: '',
    department: '',
    programs: []
  });
  const [departmentPrograms, setDepartmentPrograms] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departmentLecturers, setDepartmentLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingLecturers, setLoadingLecturers] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);
        await Promise.all([
          fetchCourses(),
          fetchDepartments()
        ]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.department) {
      fetchProgramsByDepartment(formData.department);
    }
  }, [formData.department]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchLecturers(selectedDepartment);
    }
  }, [selectedDepartment]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError('Failed to load departments');
    }
  };

  const fetchProgramsByDepartment = async (departmentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/departments/${departmentId}/programs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      setDepartmentPrograms(data);
    } catch (err) {
      setError('Failed to load programs');
    }
  };

  const fetchLecturers = async (departmentId) => {
    if (!departmentId) return;
    
    try {
      setLoadingLecturers(true);
      setError(''); // Clear any previous errors
      
      const response = await fetch(
        `http://localhost:5000/api/admin/departments/${departmentId}/lecturers`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lecturers: ${response.statusText}`);
      }

      const data = await response.json();
      setDepartmentLecturers(data);
    } catch (err) {
      console.error('Error fetching lecturers:', err);
      setError('Failed to load lecturers for this department');
      setDepartmentLecturers([]); // Reset lecturers on error
    } finally {
      setLoadingLecturers(false);
    }
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setFormData({
      name: '',
      code: '',
      semester: '',
      year: '',
      department: '',
      programs: []
    });
    setOpenDialog(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      semester: course.semester,
      year: course.year,
      department: course.department._id,
      programs: course.programs.map(p => ({
        program: p.program._id,
        lecturer: p.lecturer?._id || ''
      }))
    });
    setOpenDialog(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (!response.ok) throw new Error('Failed to delete course');
        setSuccess('Course deleted successfully');
        fetchCourses();
      } catch (err) {
        setError('Failed to delete course');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedCourse
        ? `http://localhost:5000/api/admin/courses/${selectedCourse._id}`
        : 'http://localhost:5000/api/admin/courses';

      const response = await fetch(url, {
        method: selectedCourse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to save course');
      }

      const data = await response.json();
      setSuccess(data.msg);
      setOpenDialog(false);
      fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to save course');
    }
  };

  const handleAddProgram = () => {
    setFormData({
      ...formData,
      programs: [
        ...formData.programs,
        { program: '', lecturer: '' }
      ]
    });
  };

  const handleRemoveProgram = (index) => {
    const newPrograms = formData.programs.filter((_, i) => i !== index);
    setFormData({ ...formData, programs: newPrograms });
  };

  const handleProgramChange = (index, field, value) => {
    const newPrograms = [...formData.programs];
    newPrograms[index] = {
      ...newPrograms[index],
      [field]: value
    };
    setFormData({ ...formData, programs: newPrograms });
  };

  const handleDepartmentChange = async (event) => {
    const deptId = event.target.value;
    setSelectedDepartment(deptId);
    setFormData(prev => ({
      ...prev,
      department: deptId,
      programs: [] // Reset programs when department changes
    }));
    
    if (deptId) {
      await fetchLecturers(deptId);
    } else {
      setDepartmentLecturers([]);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
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

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCourse}
        >
          Add New Course
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Programs</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course._id}>
                <TableCell>{course.code}</TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell>{course.department?.name}</TableCell>
                <TableCell>
                  {course.programs.map((prog, index) => (
                    <Chip
                      key={index}
                      label={`${prog.program?.name} (${prog.lecturer?.name || 'No lecturer'})`}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>{course.semester}</TableCell>
                <TableCell>{course.year}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditCourse(course)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteCourse(course._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Course Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Course Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    onChange={handleDepartmentChange}
                    label="Department"
                    required
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    label="Semester"
                  >
                    <MenuItem value={1}>First Semester</MenuItem>
                    <MenuItem value={2}>Second Semester</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6">Programs and Lecturers</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddProgram}
                sx={{ mt: 1 }}
              >
                Add Program
              </Button>
            </Box>

            {formData.programs.map((prog, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <FormControl fullWidth required>
                      <InputLabel>Program</InputLabel>
                      <Select
                        value={prog.program}
                        onChange={(e) => handleProgramChange(index, 'program', e.target.value)}
                        label="Program"
                      >
                        {departmentPrograms.map((program) => (
                          <MenuItem key={program._id} value={program._id}>
                            {program.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Lecturer</InputLabel>
                      <Select
                        value={prog.lecturer || ''}
                        onChange={(e) => handleProgramChange(index, 'lecturer', e.target.value)}
                        label="Lecturer"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {departmentLecturers.map((lecturer) => (
                          <MenuItem key={lecturer._id} value={lecturer._id}>
                            {lecturer.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      color="error"
                      onClick={() => handleRemoveProgram(index)}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement; 