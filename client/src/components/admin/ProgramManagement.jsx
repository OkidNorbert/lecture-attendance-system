import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Save as SaveIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`program-tabpanel-${index}`}
      aria-labelledby={`program-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProgramManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [dialogMode, setDialogMode] = useState('add');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assignCoursesOpen, setAssignCoursesOpen] = useState(false);
  const [assignStudentsOpen, setAssignStudentsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
    departmentId: '',
    description: '',
    duration: 4,
    totalCredits: 120,
    status: 'active'
  });

  useEffect(() => {
    fetchFaculties();
    fetchDepartments();
    fetchPrograms();
    fetchCourses();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (success) {
      fetchPrograms();
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/faculties', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFaculties(response.data);
    } catch (err) {
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
      setError('Failed to fetch departments');
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/programs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Fetched programs:', response.data);
      setPrograms(response.data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/admin/courses');
      setCourses(response.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/admin/users?role=student');
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (mode, program = null) => {
    setDialogMode(mode);
    if (program) {
      setSelectedProgram(program);
      setFormData({
        name: program.name || '',
        code: program.code || '',
        facultyId: program.facultyId?._id || program.facultyId || '',
        departmentId: program.departmentId?._id || program.departmentId || '',
        description: program.description || '',
        duration: program.duration || 4,
        totalCredits: program.totalCredits || 120,
        status: program.status
      });
    } else {
      setFormData({
        name: '',
        code: '',
        facultyId: '',
        departmentId: '',
        description: '',
        duration: 4,
        totalCredits: 120,
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProgram(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (dialogMode === 'add') {
        await axios.post(
          'http://localhost:5000/api/admin/programs',
          formData,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        setSuccess('Program added successfully');
      } else {
        await axios.put(
          `http://localhost:5000/api/admin/programs/${selectedProgram._id}`,
          formData,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        setSuccess('Program updated successfully');
      }
      await fetchPrograms();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error adding/updating program');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/programs/${selectedProgram._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSuccess('Program deleted successfully');
      await fetchPrograms();
      setDeleteConfirmOpen(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting program');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourses = (program) => {
    setSelectedProgram(program);
    const programCourses = courses.filter(
      course => course.programId?._id === program._id || course.programId === program._id
    );
    setSelectedCourses(programCourses.map(course => course._id));
    setAssignCoursesOpen(true);
  };

  const handleSaveAssignedCourses = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/admin/programs/${selectedProgram._id}/courses`, {
        courseIds: selectedCourses
      });
      setSuccess('Courses assigned successfully');
      await fetchPrograms();
      setAssignCoursesOpen(false);
    } catch (err) {
      setError('Error: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudents = (program) => {
    setSelectedProgram(program);
    const programStudents = students.filter(
      student => student.program === program._id
    );
    setSelectedStudents(programStudents.map(student => student._id));
    setAssignStudentsOpen(true);
  };

  const handleSaveAssignedStudents = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/admin/programs/${selectedProgram._id}/students`, {
        studentIds: selectedStudents
      });
      setSuccess('Students enrolled successfully');
      await fetchPrograms();
      setAssignStudentsOpen(false);
    } catch (err) {
      setError('Error: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Program Management</Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="program management tabs">
          <Tab label="Programs" />
          <Tab label="Course Assignment" />
          <Tab label="Student Enrollment" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Programs List</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('add')}
            >
              Add Program
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {programs.map((program) => (
                <Grid item xs={12} key={program._id}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" component="h3">
                            {program.name}
                          </Typography>
                          <Typography 
                            variant="subtitle2" 
                            color="primary"
                            sx={{ mb: 1 }}
                          >
                            Code: {program.code}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={program.status}
                            color={
                              program.status === 'active' ? 'success' :
                              program.status === 'inactive' ? 'warning' : 'error'
                            }
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog('edit', program)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setSelectedProgram(program);
                                setDeleteConfirmOpen(true);
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Faculty:</strong> {program.facultyId?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Department:</strong> {program.departmentId?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Duration:</strong> {program.duration} years
                        </Typography>
                        <Typography variant="body2">
                          <strong>Credits:</strong> {program.totalCredits}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Description:</strong>
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="textSecondary"
                          sx={{
                            maxHeight: '60px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {program.description || 'No description available'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Course Assignments</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Based on your ER diagram, programs have courses. Assign courses to programs here.
          </Alert>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {programs.map((program) => {
                const programCourses = courses.filter(
                  course => course.programId?._id === program._id || course.programId === program._id
                );
                
                return (
                  <Grid item xs={12} key={program._id}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" component="h3">
                              {program.name}
                            </Typography>
                            <Typography 
                              variant="subtitle2" 
                              color="primary"
                              sx={{ mb: 1 }}
                            >
                              Code: {program.code}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={program.status}
                              color={
                                program.status === 'active' ? 'success' :
                                program.status === 'inactive' ? 'warning' : 'error'
                              }
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Tooltip title="Assign Courses">
                              <IconButton 
                                size="small" 
                                onClick={() => handleAssignCourses(program)}
                                sx={{ color: 'primary.main' }}
                              >
                                <MenuBookIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="textSecondary">
                            <strong>Department:</strong> {program.departmentId?.name || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Credits:</strong> {program.totalCredits}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Assigned Courses:</strong>
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="textSecondary"
                            sx={{
                              maxHeight: '60px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {programCourses.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {programCourses.map(course => (
                                  <Chip 
                                    key={course._id} 
                                    label={`${course.code}`} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No courses assigned
                              </Typography>
                            )}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Student Enrollments</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Based on your ER diagram, students belong to programs. Enroll students in programs here.
          </Alert>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {programs.map((program) => {
                const programStudents = students.filter(
                  student => student.program === program._id
                );
                
                return (
                  <Grid item xs={12} key={program._id}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" component="h3">
                              {program.name}
                            </Typography>
                            <Typography 
                              variant="subtitle2" 
                              color="primary"
                              sx={{ mb: 1 }}
                            >
                              Code: {program.code}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={program.status}
                              color={
                                program.status === 'active' ? 'success' :
                                program.status === 'inactive' ? 'warning' : 'error'
                              }
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Tooltip title="Enroll Students">
                              <IconButton 
                                size="small" 
                                onClick={() => handleAssignStudents(program)}
                                sx={{ color: 'primary.main' }}
                              >
                                <PersonIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="textSecondary">
                            <strong>Department:</strong> {program.departmentId?.name || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Credits:</strong> {program.totalCredits}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Enrolled Students:</strong>
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="textSecondary"
                            sx={{
                              maxHeight: '60px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {programStudents.length > 0 ? (
                              <Typography>
                                {programStudents.length} students enrolled
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No students enrolled
                              </Typography>
                            )}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>
      </TabPanel>

      {/* Add/Edit Program Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{dialogMode === 'add' ? 'Add New Program' : 'Edit Program'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Program Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="code"
                  label="Program Code"
                  name="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="faculty-label">Faculty</InputLabel>
                  <Select
                    labelId="faculty-label"
                    id="faculty"
                    value={formData.facultyId}
                    label="Faculty"
                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  >
                    {faculties.map(faculty => (
                      <MenuItem key={faculty._id} value={faculty._id}>
                        {faculty.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    id="department"
                    value={formData.departmentId}
                    label="Department"
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    {departments.map(department => (
                      <MenuItem key={department._id} value={department._id}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="duration"
                  label="Duration (Years)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="totalCredits"
                  label="Total Credits"
                  name="totalCredits"
                  type="number"
                  value={formData.totalCredits}
                  onChange={(e) => setFormData({ ...formData, totalCredits: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="description"
                  label="Description"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {dialogMode === 'add' ? 'Add Program' : 'Update Program'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the program "{selectedProgram?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Courses Dialog */}
      <Dialog
        open={assignCoursesOpen}
        onClose={() => setAssignCoursesOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Assign Courses to {selectedProgram?.name}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Select courses to assign to this program
          </Typography>
          <Box sx={{ mt: 2, maxHeight: '400px', overflowY: 'auto' }}>
            <Grid container spacing={1}>
              {courses.map(course => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Paper 
                    sx={{ 
                      p: 1, 
                      bgcolor: selectedCourses.includes(course._id) ? 'rgba(106, 17, 203, 0.1)' : 'white',
                      border: selectedCourses.includes(course._id) ? '1px solid #6a11cb' : '1px solid #eee',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      if (selectedCourses.includes(course._id)) {
                        setSelectedCourses(selectedCourses.filter(id => id !== course._id));
                      } else {
                        setSelectedCourses([...selectedCourses, course._id]);
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {course.code}
                        </Typography>
                        <Typography variant="body2" noWrap>
                          {course.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {selectedCourses.length} courses selected
          </Typography>
          <Button onClick={() => setAssignCoursesOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveAssignedCourses} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save Assignments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Students Dialog */}
      <Dialog
        open={assignStudentsOpen}
        onClose={() => setAssignStudentsOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Enroll Students in {selectedProgram?.name}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Select students to enroll in this program
          </Typography>
          <Box sx={{ mt: 2, maxHeight: '400px', overflowY: 'auto' }}>
            <Grid container spacing={1}>
              {students.map(student => (
                <Grid item xs={12} sm={6} key={student._id}>
                  <Paper 
                    sx={{ 
                      p: 1, 
                      bgcolor: selectedStudents.includes(student._id) ? 'rgba(106, 17, 203, 0.1)' : 'white',
                      border: selectedStudents.includes(student._id) ? '1px solid #6a11cb' : '1px solid #eee',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      if (selectedStudents.includes(student._id)) {
                        setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                      } else {
                        setSelectedStudents([...selectedStudents, student._id]);
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1">
                          {student.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {student.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {selectedStudents.length} students selected
          </Typography>
          <Button onClick={() => setAssignStudentsOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveAssignedStudents} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save Enrollments
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgramManagement; 