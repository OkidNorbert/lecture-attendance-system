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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: ''
  });
  const [editingUser, setEditingUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/admin/users',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setUsers([...users, response.data]);
      setFormData({ name: '', email: '', role: 'user', password: '' });
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating user');
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
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // Don't populate password
    });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormData({ name: '', email: '', role: 'user', password: '' });
    setEditingUser(null);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              size="small"
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              size="small"
            />
            <FormControl required size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="faculty">Faculty</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              size="small"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Add User'}
            </Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !users.length ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(user)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(user._id)}
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
        aria-labelledby="edit-user-title"
      >
        <DialogTitle id="edit-user-title">
          Edit User
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
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <FormControl required fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="faculty">Faculty</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="New Password (leave blank to keep current)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
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
            Are you sure you want to delete this user? This action cannot be undone.
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

export default UserManagement; 