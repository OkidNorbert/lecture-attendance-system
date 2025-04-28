import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
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
  CardContent,
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
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ResponsiveAdminContainer from './ResponsiveAdminContainer';
import { ResponsiveGridContainer, ResponsiveGridItem, ResponsiveFormContainer } from './ResponsiveGrid';
import ResponsiveTable from './ResponsiveTable';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');
  const isTV = useMediaQuery('(min-width: 1600px)');
  const navigate = useNavigate();

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
      const response = await axios.get('/api/admin/faculties');
      setFaculties(response.data);
    } catch (err) {
      setError('Failed to fetch faculties');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/admin/departments');
      setDepartments(response.data);
    } catch (err) {
      setError('Failed to fetch departments');
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/programs');
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
      if (dialogMode === 'add') {
        await axios.post('/api/admin/programs', formData);
        setSuccess('Program added successfully');
      } else {
        await axios.put(`/api/admin/programs/${selectedProgram._id}`, formData);
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
      await axios.delete(`/api/admin/programs/${selectedProgram._id}`);
      
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
      await axios.post(`/api/admin/programs/${selectedProgram._id}/courses`, {
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
      await axios.post(`/api/admin/programs/${selectedProgram._id}/students`, {
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
    <ResponsiveAdminContainer title="Program Management">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ 
        p: { xs: 1.5, sm: 2, md: 3 }, 
        mb: 3,
        '@media (orientation: landscape) and (max-height: 600px)': {
          p: 1.5
        }
      }}>
        <ResponsiveFormContainer component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Program Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                size={isMobile ? "small" : "medium"}
                fullWidth
                />
              </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl 
                  required
                  fullWidth
                size={isMobile ? "small" : "medium"}
              >
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
              </Grid>
            <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Duration (Years)"
                  type="number"
                  value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                inputProps={{ min: 1, max: 6 }}
                size={isMobile ? "small" : "medium"}
                  fullWidth
                />
              </Grid>
            <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                  fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : dialogMode === 'add' ? 'Add Program' : 'Update Program'}
              </Button>
            </Grid>
          </Grid>
        </ResponsiveFormContainer>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="subtitle1" component="div">
          {programs.length} Programs Available
        </Typography>
      </Box>

      <ResponsiveTable
        columns={[
          { header: 'Name', field: 'name' },
          { header: 'Department', render: (row) => row.department?.name || 'Unknown Department' },
          { header: 'Duration', field: 'duration', render: (row) => `${row.duration} years` },
          { 
            header: 'Actions', 
            align: 'right',
            render: (row) => (
              <>
                <IconButton 
                  size="small"
                  onClick={() => navigate(`/admin/programs/${row._id}`)}
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('edit', row)}
                  color="secondary"
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedProgram(row);
                    setDeleteConfirmOpen(true);
                  }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )
          }
        ]}
        data={programs}
        loading={loading}
        emptyMessage="No programs found"
        renderMobileCard={(program) => (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" component="div" sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  {program.name}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {program.department?.name || 'Unknown Department'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <Chip 
                    size="small" 
                    label={`${program.duration} years`} 
                    color="primary" 
                    variant="outlined" 
                  />
                </Typography>
          </Box>
              <Box>
                <IconButton 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/programs/${program._id}`);
                  }}
                  color="primary"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDialog('edit', program);
                  }}
                  color="secondary"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProgram(program);
                    setDeleteConfirmOpen(true);
                  }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        )}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this program? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveAdminContainer>
  );
};

export default ProgramManagement; 