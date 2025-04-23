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
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);

  // Add ref for dialog focus management
  const dialogTitleRef = React.useRef(null);

  // Add success message state
  const [successMessage, setSuccessMessage] = useState('');

  // Add useEffect to clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/faculties', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFaculties(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setError(err.response?.data?.msg || 'Error fetching faculties');
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
        'http://localhost:5000/api/admin/faculties',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setFaculties([...faculties, response.data]);
      setFormData({ name: '', code: '', description: '' });
      setError('');
    } catch (err) {
      console.error('Error creating faculty:', err);
      setError(err.response?.data?.msg || 'Error creating faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    // Set form data with current faculty values
    setFormData({
      name: faculty.name || '',
      code: faculty.code || '',
      description: faculty.description || ''
    });
    setOpenDialog(true);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/admin/faculties/${editingFaculty._id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update the faculties array with the updated faculty
      setFaculties(prevFaculties => 
        prevFaculties.map(faculty => 
          faculty._id === editingFaculty._id ? response.data : faculty
        )
      );

      // Show success message
      setError(''); // Clear any existing errors
      
      // Reset form and close dialog
      handleDialogClose();
      
      // Refresh the faculties list
      fetchFaculties();

    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.msg || 'Error updating faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setSelectedFacultyId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/admin/faculties/${selectedFacultyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setFaculties(faculties.filter(f => f._id !== selectedFacultyId));
      setDeleteConfirmOpen(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormData({ name: '', code: '', description: '' });
    setEditingFaculty(null);
  };

  const handleDeleteDialogClose = () => {
    setDeleteConfirmOpen(false);
    setSelectedFacultyId(null);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Faculty Management</Typography>
      
      {/* Success and Error Messages */}
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

      {/* Add New Faculty */}
      <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Add New Faculty</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Faculty Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              size="small"
            />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Faculty Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              size="small"
            />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              size="small"
            />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Faculty'}
            </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Faculties Table */}
      <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, borderRadius: 2, overflow: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Faculties</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table sx={{ minWidth: { xs: 650, sm: 750 } }} aria-label="faculties table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
                {faculties.map((faculty) => (
                <TableRow key={faculty._id}>
                  <TableCell>{faculty.name}</TableCell>
                  <TableCell>{faculty.code}</TableCell>
                  <TableCell>{faculty.description}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(faculty)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(faculty._id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Faculty</DialogTitle>
        <DialogContent sx={{ pt: { xs: 1, sm: 2 } }}>
          <Box 
            component="form" 
            noValidate 
            sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate();
            }}
          >
            <TextField
              autoFocus
              label="Faculty Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              id="faculty-name"
            />
            <TextField
              label="Faculty Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              fullWidth
              id="faculty-code"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              id="faculty-description"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog with improved accessibility */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete this faculty? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteDialogClose}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
            aria-label="Confirm faculty deletion"
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyManagement; 