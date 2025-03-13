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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
    departmentId: '',
    description: '',
    duration: '',
    totalCredits: '',
    status: 'active'
  });

  useEffect(() => {
    fetchFaculties();
    fetchDepartments();
    fetchPrograms();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/admin/programs',
        formData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setSuccess('Program added successfully');
      setFormData({
        name: '',
        code: '',
        facultyId: '',
        departmentId: '',
        description: '',
        duration: '',
        totalCredits: '',
        status: 'active'
      });
      
      await fetchPrograms();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error adding program');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const updatedFormData = {
        ...formData,
        totalCredits: Number(formData.totalCredits),
        duration: Number(formData.duration)
      };

      const response = await axios.put(
        `http://localhost:5000/api/admin/programs/${selectedProgram._id}`,
        updatedFormData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      console.log('Updated program:', response.data);

      setSuccess('Program updated successfully');
      setOpenDialog(false);
      setSelectedProgram(null);
      setFormData({
        name: '',
        code: '',
        facultyId: '',
        departmentId: '',
        description: '',
        duration: '',
        totalCredits: '',
        status: 'active'
      });
      
      await fetchPrograms();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.msg || 'Error updating program');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (programId) => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/programs/${programId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSuccess('Program deleted successfully');
      await fetchPrograms();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting program');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      code: program.code,
      facultyId: program.facultyId?._id || '',
      departmentId: program.departmentId?._id || '',
      description: program.description || '',
      duration: program.duration,
      totalCredits: program.totalCredits,
      status: program.status
    });
    setOpenDialog(true);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Add Program Form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add New Program
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Program Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Program Code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
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
                </Grid>
                <Grid item xs={12}>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duration (Years)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                    inputProps={{ min: 1, max: 6 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Credits"
                    type="number"
                    value={formData.totalCredits}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      totalCredits: e.target.value ? Number(e.target.value) : '' 
                    })}
                    required
                    inputProps={{ 
                      min: 30, 
                      max: 300 
                    }}
                    helperText="Total credits (30-300)"
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
                    {loading ? <CircularProgress size={24} /> : 'Add Program'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Programs List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Programs List
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : programs.length === 0 ? (
              <Typography color="textSecondary" align="center">
                No programs found
              </Typography>
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
                                onClick={() => handleEdit(program)}
                                sx={{ color: 'primary.main' }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDelete(program._id)}
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
        </Grid>
      </Grid>

      {/* Add Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          setSelectedProgram(null);
          setFormData({
            name: '',
            code: '',
            facultyId: '',
            departmentId: '',
            description: '',
            duration: '',
            totalCredits: '',
            status: 'active'
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedProgram ? 'Edit Program' : 'Add Program'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Program Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Program Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
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
            </Grid>
            <Grid item xs={12}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (Years)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                inputProps={{ min: 1, max: 6 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Credits"
                type="number"
                value={formData.totalCredits}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  totalCredits: e.target.value ? Number(e.target.value) : '' 
                })}
                required
                inputProps={{ 
                  min: 30, 
                  max: 130 
                }}
                helperText="Total credits (30-130)"
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              setSelectedProgram(null);
              setFormData({
                name: '',
                code: '',
                facultyId: '',
                departmentId: '',
                description: '',
                duration: '',
                totalCredits: '',
                status: 'active'
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={selectedProgram ? handleUpdate : handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : selectedProgram ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgramManagement; 