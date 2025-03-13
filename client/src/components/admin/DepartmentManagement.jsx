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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
    description: ''
  });
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchFaculties();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDepartments(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error fetching departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/faculties', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFaculties(response.data);
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/admin/departments',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setDepartments([...departments, response.data]);
      setFormData({ name: '', code: '', facultyId: '', description: '' });
      setSuccessMessage('Department created successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating department');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/admin/departments/${editingDepartment._id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setDepartments(departments.map(dept => 
        dept._id === editingDepartment._id ? response.data : dept
      ));
      handleDialogClose();
      setSuccessMessage('Department updated successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating department');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setSelectedDepartmentId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/admin/departments/${selectedDepartmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setDepartments(departments.filter(dept => dept._id !== selectedDepartmentId));
      setDeleteConfirmOpen(false);
      setSuccessMessage('Department deleted successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting department');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      facultyId: department.facultyId._id,
      description: department.description || ''
    });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormData({ name: '', code: '', facultyId: '', description: '' });
    setEditingDepartment(null);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Department Management
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Department Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              size="small"
            />
            <TextField
              label="Department Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              size="small"
            />
            <FormControl required size="small" sx={{ minWidth: 200 }}>
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
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              size="small"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Department'}
            </Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !departments.length ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow key={department._id}>
                  <TableCell>{department.name}</TableCell>
                  <TableCell>{department.code}</TableCell>
                  <TableCell>{department.facultyId?.name}</TableCell>
                  <TableCell>{department.description}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(department)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(department._id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        aria-labelledby="edit-department-title"
      >
        <DialogTitle id="edit-department-title">
          Edit Department
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Department Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Department Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              fullWidth
            />
            <FormControl required fullWidth>
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
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUpdate} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this department? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
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
    </Box>
  );
};

export default DepartmentManagement;