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
    <Box>
      <Typography variant="h6" gutterBottom>
        Faculty Management
      </Typography>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Faculty Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              size="small"
            />
            <TextField
              label="Faculty Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              size="small"
            />
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
              {loading ? <CircularProgress size={24} /> : 'Add Faculty'}
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
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : faculties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No faculties found
                </TableCell>
              </TableRow>
            ) : (
              faculties.map((faculty) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        aria-labelledby="edit-faculty-title"
      >
        <DialogTitle id="edit-faculty-title">
          Edit Faculty
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