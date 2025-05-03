import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
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
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    facultyId: '',
    departmentId: '',
    programId: '',
    semester: '',
    status: ''
  });
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
    departmentId: '',
    programId: '',
    description: '',
    credits: '',
    semester: '',
    programYear: '',
    status: 'active'
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Filter programs based on selected faculty and department
    if (formData.facultyId && formData.departmentId) {
      const filtered = programs.filter(program => 
        program.facultyId && program.departmentId && 
        program.facultyId._id === formData.facultyId && 
        program.departmentId._id === formData.departmentId
      );
      setFilteredPrograms(filtered);
      
      // Reset programId if the current one doesn't match the filters
      if (formData.programId) {
        const programExists = filtered.some(p => p._id === formData.programId);
        if (!programExists) {
          setFormData(prev => ({ ...prev, programId: '' }));
        }
      }
    } else {
      setFilteredPrograms(programs);
    }
  }, [formData.facultyId, formData.departmentId, programs]);

  useEffect(() => {
    console.log('Filter or courses changed - applying filters');
    
    if (courses.length === 0) {
      setFilteredCourses([]);
      return;
    }

    console.log('Applying filters:', filters);
    console.log('Original courses:', courses);

    let result = [...courses];

    // Apply filters
    if (filters.facultyId) {
      result = result.filter(course => {
        // Convert faculty data to string for comparison
        const courseFacultyId = course.faculty?._id?.toString() || 
                               (typeof course.faculty === 'string' ? course.faculty : course.faculty?.id?.toString()) || 
                               course.facultyId?._id?.toString() || 
                               (typeof course.facultyId === 'string' ? course.facultyId : course.facultyId?.id?.toString());
        
        // Ensure both values are trimmed strings
        const normalizedCourseFacultyId = courseFacultyId?.toString().trim() || '';
        const normalizedFilterFacultyId = filters.facultyId?.toString().trim() || '';
        
        console.log('Course faculty ID:', normalizedCourseFacultyId, 'Filter faculty ID:', normalizedFilterFacultyId);
        return normalizedCourseFacultyId === normalizedFilterFacultyId;
      });
    }

    if (filters.departmentId) {
      result = result.filter(course => {
        // Convert department data to string for comparison
        const courseDeptId = course.department?._id?.toString() || 
                            (typeof course.department === 'string' ? course.department : course.department?.id?.toString()) || 
                            course.departmentId?._id?.toString() || 
                            (typeof course.departmentId === 'string' ? course.departmentId : course.departmentId?.id?.toString());
        
        // Ensure both values are trimmed strings
        const normalizedCourseDeptId = courseDeptId?.toString().trim() || '';
        const normalizedFilterDeptId = filters.departmentId?.toString().trim() || '';
        
        console.log('Course department ID:', normalizedCourseDeptId, 'Filter department ID:', normalizedFilterDeptId);
        return normalizedCourseDeptId === normalizedFilterDeptId;
      });
    }

    if (filters.programId) {
      result = result.filter(course => {
        // Convert program data to string for comparison
        const programId = course.program_id?._id?.toString() || 
                         (typeof course.program_id === 'string' ? course.program_id : null) || 
                         course.programId?._id?.toString() || 
                         (typeof course.programId === 'string' ? course.programId : null) || 
                         course.program?.id?.toString() ||
                         course.program?._id?.toString();
        
        // Ensure both values are trimmed strings
        const normalizedProgramId = programId?.toString().trim() || '';
        const normalizedFilterProgramId = filters.programId?.toString().trim() || '';
        
        console.log('Course program ID:', normalizedProgramId, 'Filter program ID:', normalizedFilterProgramId);
        return normalizedProgramId === normalizedFilterProgramId;
      });
    }

    if (filters.semester) {
      result = result.filter(course => {
        const courseSemester = course.semester?.toString().trim() || '';
        const filterSemester = filters.semester?.toString().trim() || '';
        
        console.log('Course semester:', courseSemester, 'Filter semester:', filterSemester);
        return courseSemester === filterSemester;
      });
    }

    if (filters.status) {
      result = result.filter(course => {
        const courseStatus = course.status?.toString().trim() || '';
        const filterStatus = filters.status?.toString().trim() || '';
        
        console.log('Course status:', courseStatus, 'Filter status:', filterStatus);
        return courseStatus === filterStatus;
      });
    }

    console.log('Filtered courses:', result);
    setFilteredCourses(result);
  }, [courses, filters]);

  // Add useEffect to initialize filteredCourses when courses change
  useEffect(() => {
    setFilteredCourses(courses);
  }, [courses]);

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
      // Use the new detailed endpoint
      const response = await axios.get('/api/admin/courses-detailed');
      console.log('Raw courses data from API:', response.data);
      
      // Normalize course data to handle different API response formats
      const normalizedCourses = response.data.map(course => {
        console.log('Processing course:', course.name || course.course_name);
        console.log('Course program:', course.program);
        console.log('Course program_id:', course.program_id);
        console.log('Course programId:', course.programId);
        
        // Extract proper program information
        const programInfo = course.program || 
                          (course.program_id && typeof course.program_id === 'object' ? 
                            { id: course.program_id._id, name: course.program_id.name } : 
                            course.program_id ? { id: course.program_id } : null);
        
        console.log('Extracted program info:', programInfo);
        
        return {
          _id: course._id || course.id,
          name: course.name || course.course_name,
          course_name: course.course_name || course.name,
          code: course.code || course.course_code,
          course_code: course.course_code || course.code,
          program: programInfo,
          programId: programInfo || course.programId,
          program_id: programInfo || course.program_id,
          facultyId: course.facultyId || course.faculty,
          faculty: course.faculty || course.facultyId,
          departmentId: course.departmentId || course.department,
          department: course.department || course.departmentId,
          description: course.description || '',
          credits: course.credits || 0,
          semester: course.semester || '',
          programYear: course.programYear !== undefined ? Number(course.programYear) : '',
          status: course.status || 'active'
        };
      });
      
      console.log('Normalized courses:', normalizedCourses);
      setCourses(normalizedCourses);
      
      // Apply current filters to the new courses
      if (Object.values(filters).some(Boolean)) {
        console.log('Applying existing filters to new courses');
      } else {
        // If no filters active, set filteredCourses to all courses
        setFilteredCourses(normalizedCourses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses');
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await axios.get('/api/admin/faculties');
      setFaculties(response.data);
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setError('Failed to fetch faculties');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/admin/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to fetch departments');
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get('/api/admin/programs');
      console.log('Programs data:', response.data);
      
      // Ensure all programs have the necessary data
      const processedPrograms = response.data.map(program => ({
        ...program,
        _id: program._id,
        name: program.name,
        code: program.code,
        facultyId: program.facultyId || null,
        departmentId: program.departmentId || null
      }));
      
      setPrograms(processedPrograms);
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
    if (!formData.code || formData.code.trim() === '') errors.code = 'Course code is required';
    if (!formData.facultyId) errors.facultyId = 'Faculty is required';
    if (!formData.departmentId) errors.departmentId = 'Department is required';
    if (!formData.programId) errors.programId = 'Program is required';
    if (!formData.credits) errors.credits = 'Credits are required';
    if (!formData.semester) errors.semester = 'Semester is required';
    if (!formData.programYear) errors.programYear = 'Program Year is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const courseData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        facultyId: formData.facultyId,
        departmentId: formData.departmentId,
        programId: formData.programId,
        description: formData.description?.trim() || '',
        credits: Number(formData.credits),
        semester: Number(formData.semester),
        programYear: Number(formData.programYear),
        status: formData.status || 'active'
      };

      const response = await axios.post('/api/admin/courses', courseData);
      setCourses([...courses, response.data]);
      setSuccessMessage('Course created successfully');
      resetForm();
      setOpenDialog(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setValidationErrors({});

    try {
      // Validate all required fields
      const errors = {};
      if (!formData.name?.trim()) errors.name = 'Course name is required';
      if (!formData.code?.trim()) errors.code = 'Course code is required';
      if (!formData.programId) errors.programId = 'Program is required';
      if (!formData.credits) errors.credits = 'Credits are required';
      if (!formData.semester) errors.semester = 'Semester is required';
      if (!formData.programYear) errors.programYear = 'Program Year is required';

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const courseData = {
        course_name: formData.name.trim(),
        course_code: formData.code.trim().toUpperCase(),
        program_id: formData.programId,
        description: formData.description?.trim() || '',
        credits: Number(formData.credits),
        semester: String(formData.semester),
        programYear: Number(formData.programYear),
        status: formData.status || 'active',
        lecturers: formData.lecturers || [],
        faculty: formData.facultyId || null,
        department: formData.departmentId || null
      };

      // Log the complete form data and course data
      console.log('Form Data:', formData);
      console.log('Course Data being sent:', courseData);

      // Validate program year range
      if (courseData.programYear < 1 || courseData.programYear > 6) {
        setError('Program year must be between 1 and 6');
        setLoading(false);
        return;
      }

      // Validate credits range
      if (courseData.credits < 1 || courseData.credits > 25) {
        setError('Credits must be between 1 and 25');
        setLoading(false);
        return;
      }

      // Validate all required fields are present and not empty
      const requiredFields = ['course_name', 'course_code', 'program_id', 'credits', 'semester', 'programYear'];
      const missingFields = requiredFields.filter(field => !courseData[field]);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      const response = await axios.put(`/api/admin/courses/${selectedCourse._id}`, courseData);
      
      // Normalize the returned course data
      const updatedCourse = response.data.course;
      const normalizedCourse = {
        _id: updatedCourse._id || updatedCourse.id,
        name: updatedCourse.name || updatedCourse.course_name,
        course_name: updatedCourse.course_name || updatedCourse.name,
        code: updatedCourse.code || updatedCourse.course_code,
        course_code: updatedCourse.course_code || updatedCourse.code,
        programId: updatedCourse.programId || (updatedCourse.program && { _id: updatedCourse.program.id, name: updatedCourse.program.name }),
        program_id: updatedCourse.program_id || (updatedCourse.program && { _id: updatedCourse.program.id, name: updatedCourse.program.name }),
        facultyId: updatedCourse.facultyId || updatedCourse.faculty,
        faculty: updatedCourse.faculty || updatedCourse.facultyId,
        departmentId: updatedCourse.departmentId || updatedCourse.department,
        department: updatedCourse.department || updatedCourse.departmentId,
        description: updatedCourse.description || '',
        credits: updatedCourse.credits || 0,
        semester: updatedCourse.semester || '',
        programYear: updatedCourse.programYear || '',
        status: updatedCourse.status || 'active'
      };
      
      setCourses(courses.map(course => 
        course._id === selectedCourse._id ? normalizedCourse : course
      ));
      
      setSuccessMessage('Course updated successfully');
      resetForm();
      setOpenDialog(false);
    } catch (err) {
      console.error('Update error:', err.response?.data || err);
      setError(err.response?.data?.msg || 'Failed to update course');
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
      const response = await axios.delete(`/api/admin/remove-course/${courseId}`);

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
      semester: '',
      programYear: '',
      status: 'active'
    });
    setSelectedCourse(null);
    setValidationErrors({});
  };

  const handleEdit = (course) => {
    console.log('Editing course:', course);
    
    // Extract the program ID from various possible locations
    const programId = course.program_id?._id || 
                     course.program_id || 
                     course.programId?._id || 
                     course.programId || 
                     course.program?.id ||
                     course.program?._id;
                     
    console.log('Extracted program ID:', programId);
    
    // Find the program to get faculty and department data
    const programData = programs.find(p => p._id === programId);
    
    console.log('Program data for course:', programData);
    
    setSelectedCourse(course);
    setFormData({
      name: course.course_name || course.name || '',
      code: course.course_code || course.code || '',
      facultyId: course.faculty?._id || course.facultyId?._id || programData?.facultyId?._id || '',
      departmentId: course.department?._id || course.departmentId?._id || programData?.departmentId?._id || '',
      programId: programId || '',
      description: course.description || '',
      credits: course.credits || '',
      semester: course.semester || '',
      programYear: course.programYear || '',
      status: course.status || 'active'
    });
    
    // If we have a program but no faculty/department, let's try to get them from the program
    if (programData && (!formData.facultyId || !formData.departmentId)) {
      setFormData(prev => ({
        ...prev,
        facultyId: prev.facultyId || programData.facultyId?._id,
        departmentId: prev.departmentId || programData.departmentId?._id
      }));
    }
    
    setOpenDialog(true);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Filter changed: ${name} = ${value}`);
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: value
      };
      console.log('New filters state:', newFilters);
      return newFilters;
    });
  };

  const resetFilters = () => {
    console.log('Resetting filters');
    setFilters({
      facultyId: '',
      departmentId: '',
      programId: '',
      semester: '',
      status: ''
    });
    // Make sure to reset filtered courses to all courses
    setFilteredCourses(courses);
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
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!validationErrors.facultyId}>
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
                    {validationErrors.facultyId ? (
                      <FormHelperText error>{validationErrors.facultyId}</FormHelperText>
                    ) : (
                      <FormHelperText>Select to filter available programs</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!validationErrors.departmentId}>
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
                    {validationErrors.departmentId ? (
                      <FormHelperText error>{validationErrors.departmentId}</FormHelperText>
                    ) : (
                      <FormHelperText>Select to filter available programs</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
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
                      {filteredPrograms.map((program) => (
                        <MenuItem key={program._id} value={program._id}>
                          {program.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {validationErrors.programId && (
                      <FormHelperText error>{validationErrors.programId}</FormHelperText>
                    )}
                    {(!formData.facultyId || !formData.departmentId) && (
                      <FormHelperText>Select faculty and department first</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required error={!!validationErrors.semester}>
                    <InputLabel>Semester</InputLabel>
                    <Select
                      value={formData.semester}
                      label="Semester"
                      onChange={(e) => {
                        setFormData({ ...formData, semester: e.target.value });
                        setValidationErrors({ ...validationErrors, semester: '' });
                      }}
                    >
                      <MenuItem value="1">1st Semester</MenuItem>
                      <MenuItem value="2">2nd Semester</MenuItem>
                      <MenuItem value="3">3rd Semester</MenuItem>
                      <MenuItem value="4">4th Semester</MenuItem>
                      <MenuItem value="5">5th Semester</MenuItem>
                      <MenuItem value="6">6th Semester</MenuItem>
                      <MenuItem value="7">7th Semester</MenuItem>
                      <MenuItem value="8">8th Semester</MenuItem>
                    </Select>
                    {validationErrors.semester && (
                      <FormHelperText error>{validationErrors.semester}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Program Year"
                    type="number"
                    value={formData.programYear}
                    onChange={(e) => {
                      setFormData({ ...formData, programYear: e.target.value });
                      setValidationErrors({ ...validationErrors, programYear: '' });
                    }}
                    required
                    error={!!validationErrors.programYear}
                    helperText={validationErrors.programYear || "Enter program year (1-6)"}
                    inputProps={{ min: 1, max: 6 }}
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
            
            {/* Add Filter Controls */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Filter Courses
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Faculty</InputLabel>
                    <Select
                      name="facultyId"
                      value={filters.facultyId}
                      label="Faculty"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All</MenuItem>
                      {faculties.map((faculty) => (
                        <MenuItem key={faculty._id} value={faculty._id}>
                          {faculty.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="departmentId"
                      value={filters.departmentId}
                      label="Department"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All</MenuItem>
                      {departments.map((department) => (
                        <MenuItem key={department._id} value={department._id}>
                          {department.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Program</InputLabel>
                    <Select
                      name="programId"
                      value={filters.programId}
                      label="Program"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All</MenuItem>
                      {programs.map((program) => (
                        <MenuItem key={program._id} value={program._id}>
                          {program.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Semester</InputLabel>
                    <Select
                      name="semester"
                      value={filters.semester}
                      label="Semester"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="1">1st Semester</MenuItem>
                      <MenuItem value="2">2nd Semester</MenuItem>
                      <MenuItem value="3">3rd Semester</MenuItem>
                      <MenuItem value="4">4th Semester</MenuItem>
                      <MenuItem value="5">5th Semester</MenuItem>
                      <MenuItem value="6">6th Semester</MenuItem>
                      <MenuItem value="7">7th Semester</MenuItem>
                      <MenuItem value="8">8th Semester</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={filters.status}
                      label="Status"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={resetFilters}
                      startIcon={<CloseIcon />}
                      disabled={!Object.values(filters).some(Boolean)}
                    >
                      Clear Filters
                    </Button>
                    
                    {Object.values(filters).some(Boolean) && (
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="caption" color="primary">
                          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found with active filters
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredCourses.length === 0 ? (
              <Typography color="textSecondary" align="center">
                No courses found
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {filteredCourses.map((course) => (
                  <Grid item xs={12} key={course._id}>
                    <Paper sx={{ p: 2 }}>
                      {(() => {
                        console.log('Rendering course:', course);
                        console.log('Program Year:', course.programYear);
                        console.log('Faculty:', course.faculty);
                        console.log('Department:', course.department);
                        return null;
                      })()}
                      <Grid container spacing={3}>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" component="h3">
                              {course.course_name || course.name}
                            </Typography>
                            <Typography variant="subtitle2" color="primary">
                              Code: {course.course_code || course.code}
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
                            Faculty: {(() => {
                              if (course.faculty?.name) return course.faculty.name;
                              if (course.facultyId?.name) return course.facultyId.name;
                              if (typeof course.faculty === 'object' && course.faculty?._id) return `ID: ${course.faculty._id}`;
                              if (typeof course.faculty === 'string') return `ID: ${course.faculty}`;
                              return 'Not specified';
                            })()}
                          </Typography>
                          <Typography variant="body2">
                            Department: {(() => {
                              if (course.department?.name) return course.department.name;
                              if (course.departmentId?.name) return course.departmentId.name;
                              if (typeof course.department === 'object' && course.department?._id) return `ID: ${course.department._id}`;
                              if (typeof course.department === 'string') return `ID: ${course.department}`;
                              return 'Not specified';
                            })()}
                          </Typography>
                          <Typography variant="body2">
                            Program: {(() => {
                              if (course.program?.name) return course.program.name;
                              if (course.programId?.name) return course.programId.name;
                              if (course.program_id?.name) return course.program_id.name;
                              console.log('Program data missing for course:', course);
                              return 'Not specified';
                            })()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            Credits: {course.credits || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            Semester: {course.semester || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            Program Year: {course.programYear !== undefined && course.programYear !== '' ? course.programYear : 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            Status: {course.status || 'Not specified'}
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
      }} fullWidth maxWidth="md">
        <DialogTitle>
          Edit Course
          <IconButton
            aria-label="close"
            onClick={() => {
              setOpenDialog(false);
              setSelectedCourse(null);
              resetForm();
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Course Code"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  setValidationErrors({ ...validationErrors, code: '' });
                }}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!validationErrors.facultyId} margin="normal">
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
                {validationErrors.facultyId ? (
                  <FormHelperText error>{validationErrors.facultyId}</FormHelperText>
                ) : (
                  <FormHelperText>Select to filter available programs</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!validationErrors.departmentId} margin="normal">
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
                {validationErrors.departmentId ? (
                  <FormHelperText error>{validationErrors.departmentId}</FormHelperText>
                ) : (
                  <FormHelperText>Select to filter available programs</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!validationErrors.programId}>
                <InputLabel>Program</InputLabel>
                <Select
                  value={formData.programId}
                  label="Program"
                  onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                >
                  {filteredPrograms.map((program) => (
                    <MenuItem key={program._id} value={program._id}>
                      {program.name}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.programId && (
                  <FormHelperText error>{validationErrors.programId}</FormHelperText>
                )}
                {(!formData.facultyId || !formData.departmentId) && (
                  <FormHelperText>Select faculty and department first</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={formData.semester}
                  label="Semester"
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                >
                  <MenuItem value="1">1st Semester</MenuItem>
                  <MenuItem value="2">2nd Semester</MenuItem>
                  <MenuItem value="3">3rd Semester</MenuItem>
                  <MenuItem value="4">4th Semester</MenuItem>
                  <MenuItem value="5">5th Semester</MenuItem>
                  <MenuItem value="6">6th Semester</MenuItem>
                  <MenuItem value="7">7th Semester</MenuItem>
                  <MenuItem value="8">8th Semester</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                required
                fullWidth
                inputProps={{ min: 1, max: 25 }}
                helperText="Credits (1-25)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Program Year"
                type="number"
                value={formData.programYear}
                onChange={(e) => {
                  setFormData({ ...formData, programYear: e.target.value });
                  setValidationErrors({ ...validationErrors, programYear: '' });
                }}
                required
                error={!!validationErrors.programYear}
                helperText={validationErrors.programYear || "Enter program year (1-6)"}
                inputProps={{ min: 1, max: 6 }}
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
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
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