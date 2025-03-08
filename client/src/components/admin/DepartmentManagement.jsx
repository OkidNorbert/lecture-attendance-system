import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    faculty: ''
  });

  const fetchFaculties = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/faculties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch faculties');
      const data = await response.json();
      setFaculties(data);
    } catch (err) {
      setError('Failed to load faculties');
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

  useEffect(() => {
    fetchFaculties();
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.faculty) {
        throw new Error('Please select a faculty');
      }

      const url = selectedDepartment
        ? `http://localhost:5000/api/admin/departments/${selectedDepartment._id}`
        : 'http://localhost:5000/api/admin/departments';

      const method = selectedDepartment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to save department');
      }

      const data = await response.json();
      setSuccess(data.msg);
      setOpenDialog(false);
      fetchDepartments();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/departments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to delete department');
      }

      setSuccess('Department deleted successfully');
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      faculty: ''
    });
    setSelectedDepartment(null);
  };

  return (
    <Box>
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

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Departments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
        >
          Add Department
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department._id}>
                <TableCell>{department.code}</TableCell>
                <TableCell>{department.name}</TableCell>
                <TableCell>{department.faculty?.name || 'N/A'}</TableCell>
                <TableCell>{department.description}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => {
                      setSelectedDepartment(department);
                      setFormData({
                        name: department.name,
                        code: department.code,
                        description: department.description || '',
                        faculty: department.faculty?._id || ''
                      });
                      setOpenDialog(true);
                    }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(department._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDepartment ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Faculty</InputLabel>
              <Select
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                label="Faculty"
              >
                {faculties.map((faculty) => (
                  <MenuItem key={faculty._id} value={faculty._id}>
                    {faculty.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Department Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Department Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
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

export default DepartmentManagement;