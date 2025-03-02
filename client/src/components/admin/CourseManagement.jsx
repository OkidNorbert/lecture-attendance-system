import React, { useState, useEffect } from 'react';
import {
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
  Box,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: '',
    semester: '',
    year: '',
    lecturerId: '',
  });

  useEffect(() => {
    fetchCourses();
    fetchLecturers();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=lecturer');
      const data = await response.json();
      setLecturers(data);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    }
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setFormData({
      name: '',
      code: '',
      unit: '',
      semester: '',
      year: '',
      lecturerId: '',
    });
    setOpenDialog(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      unit: course.unit,
      semester: course.semester,
      year: course.year,
      lecturerId: course.lecturerId,
    });
    setOpenDialog(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await fetch(`/api/admin/remove-course/${courseId}`, {
          method: 'DELETE',
        });
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedCourse
        ? `/api/admin/courses/${selectedCourse._id}`
        : '/api/admin/courses';
      
      await fetch(url, {
        method: selectedCourse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      setOpenDialog(false);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCourse}
        >
          Add New Course
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Lecturer</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course._id}>
                <TableCell>{course.code}</TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell>{course.unit}</TableCell>
                <TableCell>{course.semester}</TableCell>
                <TableCell>{course.year}</TableCell>
                <TableCell>
                  {lecturers.find(l => l._id === course.lecturerId)?.name || 'Unassigned'}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditCourse(course)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteCourse(course._id)}>
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
          {selectedCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Course Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Course Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Course Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Semester"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              margin="normal"
            >
              <MenuItem value="1">First Semester</MenuItem>
              <MenuItem value="2">Second Semester</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Lecturer"
              value={formData.lecturerId}
              onChange={(e) => setFormData({ ...formData, lecturerId: e.target.value })}
              margin="normal"
            >
              {lecturers.map((lecturer) => (
                <MenuItem key={lecturer._id} value={lecturer._id}>
                  {lecturer.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CourseManagement; 