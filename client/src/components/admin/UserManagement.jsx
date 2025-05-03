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
  Autocomplete,
  Tooltip,
  Tabs,
  Tab,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon
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
    programYear: 1
  });
  const [editingUser, setEditingUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [unapprovedUsers, setUnapprovedUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [viewingEnrollments, setViewingEnrollments] = useState(false);
  const [programCourses, setProgramCourses] = useState([]);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');

  useEffect(() => {
    fetchUsers();
    fetchCourses();
    fetchPrograms();
    fetchEnrollments();
    
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

      // Separate approved and unapproved users
      const approvedUsers = response.data.filter(user => user.isApproved);
      const notApprovedUsers = response.data.filter(user => !user.isApproved);
      
      setUsers(approvedUsers);
      setUnapprovedUsers(notApprovedUsers);
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

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setEnrollments(response.data);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
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

      // Add role-specific fields
      if (formData.role === 'lecturer') {
        userData.department = formData.department;
      } else if (formData.role === 'student') {
        userData.program_id = formData.program;
      }
      
      // Include other fields that might be used
      if (formData.password) {
        userData.password = formData.password;
      }

      // Create user
      const endpoint = formData.role === 'lecturer' 
        ? 'http://localhost:5000/api/admin/register-lecturer'
        : 'http://localhost:5000/api/admin/register-student';
        
      const userResponse = await axios.post(
        endpoint,
        userData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const newUser = userResponse.data;

      // For students: Automatically enroll in all courses of the selected program
      if (formData.role === 'student' && formData.program) {
        // Get all courses for the selected program
        const programCoursesResponse = await axios.get(
          `http://localhost:5000/api/courses?program_id=${formData.program}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const programCourses = programCoursesResponse.data;
        
        // For each course in the program, create an enrollment
        for (const course of programCourses) {
          // Find a lecturer for this course
          let lecturerId;
          
          if (course.lecturers && course.lecturers.length > 0) {
            // Use the first lecturer assigned to the course
            lecturerId = course.lecturers[0];
          } else {
            // Try to find any lecturer
            const lecturersResponse = await axios.get(
              'http://localhost:5000/api/users?role=lecturer',
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (lecturersResponse.data.length > 0) {
              lecturerId = lecturersResponse.data[0]._id;
            } else {
              console.error(`No lecturer found for course ${course._id}`);
              continue; // Skip this enrollment
            }
          }
          
          // Create enrollment
          await axios.post(
            'http://localhost:5000/api/enrollments',
            {
              studentId: newUser._id,
              courseId: course._id,
              lecturerId,
              programId: formData.program,
              semester: formData.semester,
              programYear: formData.programYear
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
      // For lecturers: Assign them to selected courses
      else if (formData.role === 'lecturer' && formData.courses.length > 0) {
        for (const courseId of formData.courses) {
          // Update course to add lecturer
          await axios.put(
            `http://localhost:5000/api/courses/${courseId}/lecturers`,
            {
              lecturerId: newUser._id
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Get students enrolled in this course
          const enrollmentsResponse = await axios.get(
            `http://localhost:5000/api/enrollments?courseId=${courseId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Update enrollments to include this lecturer
          for (const enrollment of enrollmentsResponse.data) {
            await axios.put(
              `http://localhost:5000/api/enrollments/${enrollment._id}`,
              {
                lecturerId: newUser._id
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
        programYear: 1
      });
      setError('');
      
      // Refresh enrollments after creating new users and enrollments
      fetchEnrollments();
      
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
      const userData = {
        ...formData,
        name: `${formData.first_name} ${formData.last_name}`
      };

      // Add role-specific fields
      if (formData.role === 'lecturer') {
        userData.department = formData.department;
      } else if (formData.role === 'student') {
        userData.program_id = formData.program;
        userData.semester = formData.semester;
        userData.programYear = formData.programYear;
      }

      // Only include password if it's been changed
      if (formData.password) {
        userData.password = formData.password;
      }

      // Update user
      await axios.put(
        `http://localhost:5000/api/admin/users/${editingUser._id}`,
        userData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh users list
      await fetchUsers();
      setOpenDialog(false);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setSelectedUserId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`http://localhost:5000/api/admin/users/${selectedUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Delete successful, refresh the user list
      fetchUsers();
      
      // Close dialog
      setDeleteConfirmOpen(false);
      
      // Show success message
      setSuccess('User deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.msg || 'Failed to delete user');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    
    // Set initial form data
    const initialFormData = {
      first_name: user.first_name || (user.name ? user.name.split(' ')[0] : ''),
      last_name: user.last_name || (user.name ? user.name.split(' ')[1] : ''),
      email: user.email,
      role: user.role,
      password: '', // Don't populate password
      program: user.program_id || user.program || '',
      courses: user.courses?.map(course => (typeof course === 'object' ? course._id : course)) || [],
      semester: user.semester || '',
      programYear: user.programYear || 1
    };
    
    setFormData(initialFormData);
    
    // If user is a student and has a program, fetch the program courses
    if (user.role === 'student' && (user.program_id || user.program)) {
      handleProgramChange(user.program_id || user.program);
    }
    
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
      programYear: 1
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

  // Add program change handler
  const handleProgramChange = async (programId) => {
    setFormData({ ...formData, program: programId });
    
    if (programId && formData.role === 'student') {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/courses?program_id=${programId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setProgramCourses(response.data);
        
        // For students, automatically select all program courses
        if (formData.role === 'student') {
          setFormData(prev => ({
            ...prev,
            program: programId,
            courses: response.data.map(course => course._id)
          }));
        }
      } catch (error) {
        console.error('Error fetching program courses:', error);
      }
    } else {
      setProgramCourses([]);
    }
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
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user.name || 'Unknown User'}
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
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectedUsers.length === users.length}
                indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'name'}
                direction={orderBy === 'name' ? order : 'asc'}
                onClick={() => handleSort('name')}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'email'}
                direction={orderBy === 'email' ? order : 'asc'}
                onClick={() => handleSort('email')}
              >
                Email
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'role'}
                direction={orderBy === 'role' ? order : 'asc'}
                onClick={() => handleSort('role')}
              >
                Role
              </TableSortLabel>
            </TableCell>
            <TableCell>Program</TableCell>
            <TableCell>Semester</TableCell>
            <TableCell>Program Year</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedUsers.map((user) => (
            <TableRow key={user._id} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => handleSelectUser(user._id)}
                />
              </TableCell>
              <TableCell>
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip
                  label={user.role}
                  color={getRoleColor(user.role)}
                  size="small"
                />
              </TableCell>
              <TableCell>{user.program || '-'}</TableCell>
              <TableCell>{user.semester || '-'}</TableCell>
              <TableCell>{user.programYear || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={user.isActive ? 'Active' : 'Inactive'}
                  color={user.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(user)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Enrollments">
                    <IconButton
                      size="small"
                      onClick={() => showUserEnrollments(user._id)}
                      color="info"
                    >
                      <SchoolIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(user._id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </TableContainer>
  );

  const approveUser = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/approve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update local state
      const userToApprove = unapprovedUsers.find(user => user._id === userId);
      if (userToApprove) {
        setUnapprovedUsers(unapprovedUsers.filter(user => user._id !== userId));
        setUsers([...users, {...userToApprove, isApproved: true}]);
      }
      
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error approving user');
    } finally {
      setLoading(false);
    }
  };
  
  const showUserEnrollments = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/users/${userId}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnrollments(response.data);
      setSelectedUserId(userId);
      setViewingEnrollments(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch enrollments');
    }
  };
  
  const closeEnrollmentsView = () => {
    setViewingEnrollments(false);
    setSelectedUserId(null);
  };

  // Render pending approvals section
  const renderPendingApprovals = () => {
    if (unapprovedUsers.length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Pending Approvals ({unapprovedUsers.length})
        </Typography>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table stickyHeader aria-label="pending approvals table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Enrollments</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unapprovedUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        size="small" 
                        color={getRoleColor(user.role)} 
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => showUserEnrollments(user._id)}
                      >
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => approveUser(user._id)}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  };
  
  // Dialog for viewing enrollments
  const renderEnrollmentsDialog = () => (
    <Dialog
      open={viewingEnrollments}
      onClose={() => setViewingEnrollments(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        User Enrollments
        <IconButton
          aria-label="close"
          onClick={() => setViewingEnrollments(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Program Year</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment._id}>
                  <TableCell>{enrollment.course?.name || '-'}</TableCell>
                  <TableCell>{enrollment.semester || '-'}</TableCell>
                  <TableCell>{enrollment.programYear || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={enrollment.status}
                      color={enrollment.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(users.map((user) => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      switch (action) {
        case 'delete':
          await Promise.all(
            selectedUsers.map((id) =>
              axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          );
          setSuccess('Selected users deleted successfully');
          break;
        case 'approve':
          await Promise.all(
            selectedUsers.map((id) =>
              axios.put(
                `http://localhost:5000/api/admin/users/${id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              )
            )
          );
          setSuccess('Selected users approved successfully');
          break;
        case 'activate':
          await Promise.all(
            selectedUsers.map((id) =>
              axios.put(
                `http://localhost:5000/api/admin/users/${id}/activate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              )
            )
          );
          setSuccess('Selected users activated successfully');
          break;
        case 'deactivate':
          await Promise.all(
            selectedUsers.map((id) =>
              axios.put(
                `http://localhost:5000/api/admin/users/${id}/deactivate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              )
            )
          );
          setSuccess('Selected users deactivated successfully');
          break;
      }
      await fetchUsers();
      setSelectedUsers([]);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Implement export functionality
    const csvContent = [
      ['Name', 'Email', 'Role', 'Program', 'Semester', 'Program Year', 'Status'],
      ...users.map((user) => [
        `${user.first_name} ${user.last_name}`,
        user.email,
        user.role,
        user.program?.name || '-',
        user.semester || '-',
        user.programYear || '-',
        user.isActive ? 'Active' : 'Inactive'
      ])
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    const aValue = a[orderBy]?.toLowerCase() || '';
    const bValue = b[orderBy]?.toLowerCase() || '';
    return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <ResponsiveAdminContainer title="User Management">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenDialog(true)}
              sx={{ mr: 1 }}
            >
              Add New User
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Pending approvals section */}
      {renderPendingApprovals()}

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
                  helperText={editingUser ? "Leave blank to keep current password" : "Required for new users"}
                  required={!editingUser}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
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
                        label="Program"
                        onChange={(e) => handleProgramChange(e.target.value)}
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
                  
                  {/* Show program courses for students in edit form */}
                  {formData.role === 'student' && formData.program && programCourses.length > 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Student will be enrolled in these courses:
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                          {programCourses.map(course => (
                            <Box 
                              key={course._id} 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                py: 0.5
                              }}
                            >
                              <Chip 
                                size="small" 
                                label={course.course_code} 
                                color="primary" 
                                sx={{ mr: 1 }} 
                              />
                              <Typography variant="body2">
                                {course.course_name}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                  
                  {/* For lecturers, allow selecting courses */}
                  {formData.role === 'lecturer' && (
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
                  )}
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Semester</InputLabel>
                      <Select
                        value={formData.semester}
                        label="Semester"
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      >
                        <MenuItem value="1">Semester 1</MenuItem>
                        <MenuItem value="2">Semester 2</MenuItem>
                        <MenuItem value="3">Semester 3</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Program Year</InputLabel>
                      <Select
                        value={formData.programYear}
                        label="Program Year"
                        onChange={(e) => setFormData({ ...formData, programYear: e.target.value })}
                      >
                        <MenuItem value={1}>Year 1</MenuItem>
                        <MenuItem value={2}>Year 2</MenuItem>
                        <MenuItem value={3}>Year 3</MenuItem>
                        <MenuItem value={4}>Year 4</MenuItem>
                        <MenuItem value={5}>Year 5</MenuItem>
                        <MenuItem value={6}>Year 6</MenuItem>
                      </Select>
                    </FormControl>
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
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
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
                  helperText={editingUser ? "Leave blank to keep current password" : "Required for new users"}
                  required={!editingUser}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="lecturer">Lecturer</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.role === 'student' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Program</InputLabel>
                      <Select
                        value={formData.program}
                        label="Program"
                        onChange={(e) => handleProgramChange(e.target.value)}
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Semester"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Program Year"
                      type="number"
                      value={formData.programYear}
                      onChange={(e) => setFormData({ ...formData, programYear: e.target.value })}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={editingUser ? handleUpdate : handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingUser ? 'Update' : 'Add')}
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
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          handleBulkAction('activate');
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Activate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleBulkAction('deactivate');
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Deactivate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDelete(selectedUserId);
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Enrollments Dialog */}
      {viewingEnrollments && renderEnrollmentsDialog()}
    </ResponsiveAdminContainer>
  );
};

export default UserManagement; 