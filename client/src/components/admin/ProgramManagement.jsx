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
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    duration: '',
    description: ''
  });

  useEffect(() => {
    fetchPrograms();
    fetchDepartments();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/programs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      setPrograms(data);
    } catch (err) {
      setError('Failed to load programs');
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

  const handleAddProgram = () => {
    setSelectedProgram(null);
    setFormData({
      name: '',
      code: '',
      department: '',
      duration: '',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleEditProgram = (program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      code: program.code,
      department: program.department._id,
      duration: program.duration,
      description: program.description || ''
    });
    setOpenDialog(true);
  };

  const handleDeleteProgram = async (programId) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/programs/${programId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (!response.ok) throw new Error('Failed to delete program');
        setSuccess('Program deleted successfully');
        fetchPrograms();
      } catch (err) {
        setError('Failed to delete program');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedProgram
        ? `http://localhost:5000/api/admin/programs/${selectedProgram._id}`
        : 'http://localhost:5000/api/admin/programs';

      const response = await fetch(url, {
        method: selectedProgram ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to save program');
      }

      const data = await response.json();
      setSuccess(data.msg);
      setOpenDialog(false);
      fetchPrograms();
    } catch (err) {
      setError(err.message || 'Failed to save program');
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
          onClick={handleAddProgram}
        >
          Add New Program
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Duration (Years)</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program._id}>
                <TableCell>{program.code}</TableCell>
                <TableCell>{program.name}</TableCell>
                <TableCell>{program.department?.name}</TableCell>
                <TableCell>{program.duration}</TableCell>
                <TableCell>{program.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditProgram(program)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteProgram(program._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedProgram ? 'Edit Program' : 'Add New Program'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Program Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Program Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                label="Department"
                required
              >
                {departments.map((department) => (
                  <MenuItem key={department._id} value={department._id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Duration (Years)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              margin="normal"
              required
              inputProps={{ min: 1, max: 6 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
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

export default ProgramManagement; 