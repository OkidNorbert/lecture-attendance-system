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
  DialogContentText,
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
  ListItemText,
  FormControlLabel
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
  Refresh as RefreshIcon,
  ViewModule as GridIcon,
  ViewList as ViewListIcon
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
  const [departments, setDepartments] = useState([]);
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
  const [departmentCourses, setDepartmentCourses] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [showAllCourses, setShowAllCourses] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');

  useEffect(() => {
    fetchUsers();
    fetchCourses();
    fetchPrograms();
    fetchDepartments();
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
      
      // Make sure programs are loaded
      if (programs.length === 0) {
        await fetchPrograms();
      }

      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Process user data to ensure we have proper display info
      const processedUsers = response.data.map(user => {
        // For students, add program name if it's available
        if (user.role === 'student' && user.program_id && !user.program) {
          const program = programs.find(p => p._id === user.program_id);
          if (program) {
            return { ...user, program: program.name };
          }
        }
        return user;
      });

      // Separate approved and unapproved users
      const approvedUsers = processedUsers.filter(user => user.isApproved);
      const notApprovedUsers = processedUsers.filter(user => !user.isApproved);
      
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

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setDepartments(response.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing role, reset role-specific fields
    if (name === 'role') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Reset role-specific fields when changing roles
        department: '',
        program: '',
        semester: '',
        programYear: 1,
        // Keep courses array but clear it
        courses: []
      }));
      
      // Reset program courses if changing away from student
      if (value !== 'student') {
        setProgramCourses([]);
      }
      
      // Reset department courses if changing away from lecturer
      if (value !== 'lecturer') {
        setDepartmentCourses([]);
      }
    } else if (name === 'courses') {
      // Special handling for courses array
      setFormData(prev => ({
        ...prev,
        courses: value
      }));
    } else if (name === 'department' && formData.role === 'lecturer') {
      // If department is changed for a lecturer, update department courses
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Clear previously selected courses when department changes
        courses: [],
        // Reset course search when department changes
        courseSearch: ''
      }));
      
      // Reset showAllCourses when department changes
      setShowAllCourses(false);
      
      // Only fetch department courses if a valid department is selected
      if (value) {
        fetchDepartmentCourses(value);
      } else {
        // Clear department courses if no department is selected
        setDepartmentCourses([]);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // If changing program, fetch courses for that program
    if (name === 'program' && value) {
      handleProgramChange(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate for lecturers that selected courses
      if (formData.role === 'lecturer') {
        if (!formData.courses || formData.courses.length === 0) {
          setError('Please select at least one course for the lecturer');
          setLoading(false);
          return;
        }
      }

      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        password: formData.password || undefined,
      };

      // Add role-specific fields
      if (formData.role === 'lecturer') {
        userData.department = formData.department;
        userData.courses = formData.courses;
      } else if (formData.role === 'student') {
        userData.program_id = formData.program;
        userData.semester = formData.semester;
        userData.programYear = formData.programYear;
      }

      console.log('Submitting user data:', userData);

      // Create user based on role
      const endpoint = 'http://localhost:5000/api/auth/register';
      
      const response = await axios.post(
        endpoint,
        userData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const newUser = response.data.user || response.data;
      console.log('New user created:', newUser);

      // For lecturers: Assign them to selected courses if any were selected
      if (formData.role === 'lecturer' && formData.courses && formData.courses.length > 0) {
        // Create enrollments for lecturer with courses
        // The server already assigns the lecturer to the courses during registration
        // This step is now only needed for tracking academic year
        const lecturerId = newUser.id || newUser._id;
        if (!lecturerId) {
          console.error('Failed to get lecturer ID from response:', newUser);
          throw new Error('Could not determine lecturer ID for enrollment');
        }
        
        for (const courseId of formData.courses) {
          try {
            await axios.post(`http://localhost:5000/api/admin/lecturers/${lecturerId}/enroll/${courseId}`, 
              { academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1) },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (err) {
            console.error(`Failed to assign lecturer to course ${courseId}:`, err);
          }
        }
      }

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        role: 'student',
        password: '',
        program: '',
        courses: [],
        department: '',
        semester: '',
        programYear: 1
      });

      // Show success and refresh users
      setSuccess('User created successfully');
      fetchUsers();
      fetchEnrollments();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Error creating user');
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
      
      // For lecturers: Update course assignments if role is lecturer
      if (formData.role === 'lecturer') {
        // Get current lecturer enrollments
        const enrollmentsResponse = await axios.get(
          `http://localhost:5000/api/lecturers/${editingUser._id}/enrollments`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const currentEnrollments = enrollmentsResponse.data || [];
        const currentCourseIds = currentEnrollments.map(e => e.courseId);
        
        // Determine which courses to add and which to remove
        const coursesToAdd = formData.courses.filter(c => !currentCourseIds.includes(c));
        const coursesToRemove = currentEnrollments.filter(e => !formData.courses.includes(e.courseId));
        
        // Add new course enrollments
        for (const courseId of coursesToAdd) {
          try {
            await axios.post(
              `http://localhost:5000/api/admin/lecturers/${editingUser._id}/enroll/${courseId}`,
              { academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1) },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (err) {
            console.error(`Failed to add lecturer to course ${courseId}:`, err);
          }
        }
        
        // Remove course enrollments that were deselected
        for (const enrollment of coursesToRemove) {
          try {
            await axios.delete(
              `http://localhost:5000/api/admin/lecturers/${editingUser._id}/enroll/${enrollment.courseId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (err) {
            console.error(`Failed to remove lecturer from course ${enrollment.courseId}:`, err);
          }
        }
      }

      // Refresh users list and enrollments
      await fetchUsers();
      await fetchEnrollments();
      setOpenDialog(false);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.msg || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    setSelectedUserId(id);
    if (name) {
      setSelectedUserName(name);
    }
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
      setSelectedUserId(null);
      setSelectedUserName('');
    }
  };

  const handleEdit = async (user) => {
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
      programYear: user.programYear || 1,
      department: user.department || ''
    };
    
    setFormData(initialFormData);
    
    // If user is a student and has a program, fetch the program courses
    if (user.role === 'student' && (user.program_id || user.program)) {
      handleProgramChange(user.program_id || user.program);
    }
    
    // If user is a lecturer, fetch their course enrollments
    if (user.role === 'lecturer') {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/lecturers/${user._id}/enrollments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Extract course IDs from enrollments
        const courseIds = response.data.map(enrollment => enrollment.courseId);
        
        // Update form data with the lecturer's courses
        setFormData(prev => ({
          ...prev,
          courses: courseIds
        }));
      } catch (error) {
        console.error('Error fetching lecturer courses:', error);
      }
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
    setCourseSearch('');
    setShowAllCourses(false);
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

  // Add function to fetch courses for the selected department
  const fetchDepartmentCourses = async (departmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Fetch all courses
      const response = await axios.get('http://localhost:5000/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch the department to get associated program IDs
      const departmentResponse = await axios.get(`http://localhost:5000/api/admin/departments/${departmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Get programs associated with this department
      const programIds = departmentResponse.data.programs || [];
      
      // Filter courses that belong to the department's programs
      let filteredCourses = [];
      if (programIds.length > 0) {
        filteredCourses = response.data.filter(course => 
          course.program_id && programIds.includes(course.program_id)
        );
      }
      
      console.log(`Found ${filteredCourses.length} courses for department ${departmentId} with programs:`, programIds);
      
      // If no courses were found through department-program relationship,
      // just show all courses to ensure users can select something
      if (filteredCourses.length === 0) {
        console.log('No courses found for department via programs. Using all courses instead.');
        setDepartmentCourses(response.data);
        
        // Optional: Show a warning to the user
        setSuccess('No specific courses found for this department. Showing all available courses.');
      } else {
        setDepartmentCourses(filteredCourses);
      }
      
      // Clear any previous course selections when department changes
      setFormData(prev => ({
        ...prev,
        courses: [] // Clear course selections
      }));
    } catch (error) {
      console.error('Error fetching department courses:', error);
      setError('Failed to load courses for this department. Using all courses instead.');
      
      // Attempt to use all courses as a fallback
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/courses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setDepartmentCourses(response.data);
      } catch (err) {
        console.error('Failed to get all courses as fallback:', err);
        setDepartmentCourses([]);
      }
    } finally {
      setLoading(false);
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
                onClick={() => handleDelete(user._id, user.name)}
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
              <TableCell>
                {user.program_id ? (
                  programs.find(p => p._id === user.program_id)?.name || user.program || '-'
                ) : (
                  user.program || '-'
                )}
              </TableCell>
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
                      onClick={() => handleDelete(user._id, user.name)}
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
        // Format program info for display
        let userWithUpdatedInfo = {...userToApprove, isApproved: true};
        
        // If student with program_id, get the program name
        if (userToApprove.role === 'student' && userToApprove.program_id) {
          const program = programs.find(p => p._id === userToApprove.program_id);
          if (program) {
            userWithUpdatedInfo.program = program.name;
          } else {
            // If programs not loaded or program not found, fetch it
            try {
              const programResponse = await axios.get(`http://localhost:5000/api/programs/${userToApprove.program_id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (programResponse.data) {
                userWithUpdatedInfo.program = programResponse.data.name;
              }
            } catch (error) {
              console.error('Error fetching program details:', error);
            }
          }
        }
        
        setUnapprovedUsers(prev => prev.filter(user => user._id !== userId));
        setUsers(prev => [...prev, userWithUpdatedInfo]);
        
        // Show success message
        setSuccess('User approved successfully');
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
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No pending approvals</Typography>
        </Paper>
      );
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => approveUser(user._id)}
                          startIcon={<CheckCircleIcon />}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleDelete(user._id, `${user.first_name} ${user.last_name}`)}
                          startIcon={<DeleteIcon />}
                        >
                          Delete
                        </Button>
                      </Box>
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

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchCourses(),
        fetchPrograms(),
        fetchDepartments(),
        fetchEnrollments()
      ]);
      setSuccess('Data refreshed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
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

  // Render form for adding/editing users
  const renderUserForm = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {editingUser ? 'Edit User' : 'Add User'}
      </Typography>
      
      <form onSubmit={editingUser ? handleUpdate : handleSubmit}>
        <Grid container spacing={2}>
          {/* Basic user info - shown for all roles */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required={!editingUser}
              helperText={editingUser ? "Leave blank to keep current password" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
                required
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="lecturer">Lecturer</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        
          {/* Student-specific fields */}
          {formData.role === 'student' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Program</InputLabel>
                  <Select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    label="Program"
                    required
                  >
                    <MenuItem value="">Select Program</MenuItem>
                    {programs.map(program => (
                      <MenuItem key={program._id} value={program._id}>
                        {program.name} ({program.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    label="Semester"
                    required
                  >
                    <MenuItem value="">Select Semester</MenuItem>
                    <MenuItem value="1">Semester 1</MenuItem>
                    <MenuItem value="2">Semester 2</MenuItem>
                    <MenuItem value="3">Semester 3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Program Year"
                  name="programYear"
                  type="number"
                  value={formData.programYear}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 1, max: 6 } }}
                  required
                />
              </Grid>
            </>
          )}
          
          {/* Lecturer-specific fields */}
          {formData.role === 'lecturer' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department || ''}
                    onChange={handleChange}
                    label="Department"
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map(department => (
                      <MenuItem key={department._id} value={department._id}>
                        {department.name} ({department.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Courses</InputLabel>
                  <Select
                    name="courses"
                    multiple
                    value={formData.courses || []}
                    onChange={(e) => setFormData({ ...formData, courses: e.target.value })}
                    label="Courses"
                    endAdornment={
                      formData.courses?.length > 0 ? (
                        <Chip
                          size="small"
                          label={`${formData.courses.length} selected`}
                          color="primary"
                          sx={{ mr: 2 }}
                        />
                      ) : null
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((courseId) => {
                          const course = courses.find(c => c._id === courseId);
                          return (
                            <Chip 
                              key={courseId} 
                              label={course ? `${course.course_code} - ${course.course_name}` : courseId} 
                              size="small"
                              onDelete={(e) => {
                                e.stopPropagation(); // Prevent the select dropdown from opening
                                const updatedCourses = formData.courses.filter(id => id !== courseId);
                                setFormData(prev => ({
                                  ...prev,
                                  courses: updatedCourses
                                }));
                              }}
                              onMouseDown={(e) => e.stopPropagation()} // Prevent select from opening on chip click
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Search courses..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        InputProps={{
                          startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                          endAdornment: courseSearch ? (
                            <IconButton size="small" onClick={() => setCourseSearch('')}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          ) : null
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={showAllCourses}
                              onChange={(e) => setShowAllCourses(e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                          label={<Typography variant="caption">Show all courses</Typography>}
                          sx={{ m: 0 }}
                        />
                      </Box>
                    </Box>
                    {courses
                      .filter(course => 
                        course.course_code?.toLowerCase().includes(courseSearch.toLowerCase()) || 
                        course.course_name?.toLowerCase().includes(courseSearch.toLowerCase())
                      )
                      .map(course => (
                        <MenuItem key={course._id} value={course._id}>
                          {course.course_code} - {course.course_name}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                    {`Showing all ${courses.length} available courses. Use the search box to find specific courses.`}
                  </Typography>
                  {formData.courses && formData.courses.length > 0 && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error" 
                      onClick={() => setFormData(prev => ({ ...prev, courses: [] }))}
                      startIcon={<CancelIcon />}
                    >
                      Clear All Courses
                    </Button>
                  )}
                </Box>
              </Grid>
            </>
          )}
          
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (editingUser ? 'Update User' : 'Add User')}
            </Button>
            {editingUser && (
              <Button
                sx={{ ml: 2 }}
                variant="outlined"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
            )}
          </Grid>
        </Grid>
      </form>
    </Paper>
  );

  return (
    <Box sx={{ position: 'relative' }}>
      {(success || error) && (
        <Box sx={{ mb: 2 }}>
          {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        </Box>
      )}

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="User Management" />
        <Tab label="Pending Approvals" 
          icon={unapprovedUsers.length ? <Chip size="small" label={unapprovedUsers.length} color="error" /> : null}
          iconPosition="end"
        />
      </Tabs>

      {activeTab === 0 && (
        <>
          {/* User Form */}
          {renderUserForm()}
          
          {/* Search and Action Toolbar */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" component="div">
              Users ({users.length})
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search users..."
                size="small"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ minWidth: 200 }}
              />
              
              <Button 
                variant="outlined"
                startIcon={viewMode === 'table' ? <GridIcon /> : <ViewListIcon />} 
                onClick={toggleView}
                size="small"
              >
                {viewMode === 'table' ? 'Grid View' : 'Table View'}
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
                size="small"
              >
                Refresh
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleExport()}
                startIcon={<FileDownloadIcon />}
                size="small"
              >
                Export
              </Button>
            </Box>
          </Box>
          
          {/* User List Display (Table or Grid) */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : viewMode === 'table' ? renderTableView() : renderGridView()}
        </>
      )}

      {activeTab === 1 && renderPendingApprovals()}

      {/* Dialogs */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add User'}
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {renderUserForm()}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedUserName ? `user "${selectedUserName}"` : "this user"}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {viewingEnrollments && renderEnrollmentsDialog()}
    </Box>
  );
};

export default UserManagement; 