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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
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
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPrograms(),
        fetchFaculties(),
        fetchDepartments()
      ]);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/admin/programs',
        formData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setPrograms([...programs, response.data]);
      setSuccessMessage('Program created successfully');
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating program');
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
        `http://localhost:5000/api/admin/programs/${selectedProgram._id}`,
        formData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setPrograms(programs.map(program => 
        program._id === selectedProgram._id ? response.data : program
      ));
      setSuccessMessage('Program updated successfully');
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating program');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/programs/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setPrograms(programs.filter(program => program._id !== id));
      setSuccessMessage('Program deleted successfully');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting program');
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
      description: '',
      duration: '',
      totalCredits: '',
      status: 'active'
    });
    setSelectedProgram(null);
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      code: program.code,
      facultyId: program.facultyId._id,
      departmentId: program.departmentId._id,
      description: program.description,
      duration: program.duration,
      totalCredits: program.totalCredits,
      status: program.status
    });
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Program Management
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
        Add Program
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Duration (Years)</TableCell>
              <TableCell>Total Credits</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program._id}>
                <TableCell>{program.code}</TableCell>
                <TableCell>{program.name}</TableCell>
                <TableCell>{program.facultyId?.name}</TableCell>
                <TableCell>{program.departmentId?.name}</TableCell>
                <TableCell>{program.duration}</TableCell>
                <TableCell>{program.totalCredits}</TableCell>
                <TableCell>{program.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(program)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(program._id)} size="small" color="error">
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
          {selectedProgram ? 'Edit Program' : 'Add Program'}
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
              label="Program Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Program Code"
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
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Duration (Years)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
              fullWidth
              inputProps={{ min: 1, max: 6 }}
            />
            <TextField
              label="Total Credits"
              type="number"
              value={formData.totalCredits}
              onChange={(e) => setFormData({ ...formData, totalCredits: e.target.value })}
              required
              fullWidth
              inputProps={{ min: 30, max: 300 }}
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
            onClick={selectedProgram ? handleUpdate : handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : selectedProgram ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgramManagement; 