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
  useMediaQuery,
  useTheme,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Import our responsive components
import ResponsiveAdminContainer from './ResponsiveAdminContainer';
import { ResponsiveGridContainer, ResponsiveGridItem, ResponsiveCardContainer, ResponsiveFormContainer } from './ResponsiveGrid';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'student',
    password: '',
    program: '',
    courses: [],
    semester: '',
    academicYear: ''
  });
  const [editingUser, setEditingUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');

  useEffect(() => {
    fetchUsers();
    fetchCourses();
    fetchPrograms();
    
    // Auto switch to grid view on mobile or landscape orientation
    if (isMobile || isLandscape) {
      setViewMode('grid');
    } else {
      setViewMode('table');
    }
  }, [isMobile, isLandscape]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      setError(err.response?.data?.msg || 'Failed to load users');
      if (err.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token'); // Clear invalid token
        // Optionally redirect to login
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    }
  };

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/programs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
    try {
      const token = localStorage.getItem('token');
      const userData = {
        ...formData,
        name: `${formData.first_name} ${formData.last_name}`
      };

      // Create user
      const userResponse = await axios.post(
        'http://localhost:5000/api/admin/users',
        userData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const newUser = userResponse.data;

      // If user is a student or lecturer, create enrollments
      if (formData.role === 'student' || formData.role === 'lecturer') {
        for (const courseId of formData.courses) {
          await axios.post(
            'http://localhost:5000/api/enrollments',
            {
              studentId: newUser._id,
              courseId,
              programId: formData.program,
              semester: formData.semester,
              academicYear: formData.academicYear,
              lecturerId: formData.role === 'student' ? null : newUser._id
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }

      setUsers([...users, newUser]);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        role: 'student',
        password: '',
        program: '',
        courses: [],
        semester: '',
        academicYear: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating user and enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${editingUser._id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setUsers(users.map(user => 
        user._id === editingUser._id ? response.data : user
      ));
      handleDialogClose();
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setSelectedUserId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/admin/users/${selectedUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setUsers(users.filter(user => user._id !== selectedUserId));
      setDeleteConfirmOpen(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      first_name: user.name.split(' ')[0],
      last_name: user.name.split(' ')[1],
      email: user.email,
      role: user.role,
      password: '', // Don't populate password
      program: user.program,
      courses: user.courses.map(course => course._id),
      semester: user.semester,
      academicYear: user.academicYear
    });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      role: 'student',
      password: '',
      program: '',
      courses: [],
      semester: '',
      academicYear: ''
    });
    setEditingUser(null);
  };

  // Get role color for chips
  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'error';
      case 'lecturer': return 'primary';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  // Toggle view between table and grid
  const toggleView = () => {
    setViewMode(viewMode === 'table' ? 'grid' : 'table');
  };

  // Render the GridView for users
  const renderGridView = () => (
    <ResponsiveGridContainer>
      {users.map(user => (
        <ResponsiveGridItem key={user._id} xs={12} sm={6} md={4} lg={3}>
          <ResponsiveCardContainer>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                bgcolor: theme.palette[getRoleColor(user.role)].light, 
                borderRadius: '50%', 
                p: 1.5, 
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PersonIcon color={getRoleColor(user.role)} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user.name}
                </Typography>
                <Chip 
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                  color={getRoleColor(user.role)} 
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user.email}
            </Typography>
            
            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton 
                size="small" 
                onClick={() => handleEdit(user)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleDelete(user._id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </ResponsiveCardContainer>
        </ResponsiveGridItem>
      ))}
    </ResponsiveGridContainer>
  );

  // Render the TableView for users
  const renderTableView = () => (
    <TableContainer component={Paper} sx={{
      overflow: 'auto',
      '@media (max-width: 600px)': {
        maxWidth: '100vw',
      },
      '@media (orientation: landscape) and (max-height: 600px)': {
        maxHeight: '300px'
      }
    }}>
      <Table size={isMobile ? "small" : "medium"} stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip 
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                  color={getRoleColor(user.role)} 
                  size="small" 
                />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => handleEdit(user)}
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(user._id)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <ResponsiveAdminContainer title="User Management">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
          sx={{ mb: 2 }}
        >
          Add New User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <ResponsiveFormContainer>
        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    label="Role"
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="lecturer">Lecturer</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {(formData.role === 'student' || formData.role === 'lecturer') && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Program</InputLabel>
                      <Select
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        label="Program"
                        required
                      >
                        {programs.map((program) => (
                          <MenuItem key={program._id} value={program._id}>
                            {program.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      options={courses}
                      getOptionLabel={(option) => `${option.course_code} - ${option.course_name}`}
                      value={courses.filter(course => formData.courses.includes(course._id))}
                      onChange={(_, newValue) => {
                        setFormData({
                          ...formData,
                          courses: newValue.map(course => course._id)
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Courses"
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Semester"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Academic Year"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      required
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Create User'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </ResponsiveFormContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="subtitle1" component="div">
          Total Users: {users.length}
        </Typography>
        {!isMobile && !isLandscape && (
          <Button 
            variant="outlined" 
                      size="small"
            onClick={toggleView}
          >
            Switch to {viewMode === 'table' ? 'Grid' : 'Table'} View
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        viewMode === 'table' ? renderTableView() : renderGridView()
      )}

      {/* Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit User
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl required fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="lecturer">Lecturer</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="New Password (leave blank to keep current)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
              />
            </Grid>
            
            {(formData.role === 'student' || formData.role === 'lecturer') && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Program</InputLabel>
                    <Select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      label="Program"
                      required
                    >
                      {programs.map((program) => (
                        <MenuItem key={program._id} value={program._id}>
                          {program.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={courses}
                    getOptionLabel={(option) => `${option.course_code} - ${option.course_name}`}
                    value={courses.filter(course => formData.courses.includes(course._id))}
                    onChange={(_, newValue) => {
                      setFormData({
                        ...formData,
                        courses: newValue.map(course => course._id)
                      });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Courses"
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Semester"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Academic Year"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUpdate} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveAdminContainer>
  );
};

export default UserManagement; 