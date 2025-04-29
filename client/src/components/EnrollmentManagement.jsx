import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  CircularProgress
} from '@mui/material';

const EnrollmentManagement = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    lecturerId: '',
    programId: '',
    semester: '',
    programYear: 1,
    status: 'enrolled'
  });
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchCourses();
    fetchLecturers();
    fetchPrograms();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/enrollments');
      setEnrollments(response.data);
    } catch (err) {
      setError('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get('/api/users?role=student');
      setStudents(response.data);
    } catch (err) {
      setError('Failed to fetch students');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/api/courses');
      setCourses(response.data);
    } catch (err) {
      setError('Failed to fetch courses');
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await axiosInstance.get('/api/users?role=lecturer');
      setLecturers(response.data);
    } catch (err) {
      setError('Failed to fetch lecturers');
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axiosInstance.get('/api/programs');
      setPrograms(response.data);
    } catch (err) {
      setError('Failed to fetch programs');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axiosInstance.post('/api/enrollments', formData);
      setSuccess('Student enrolled successfully');
      setFormData({
        studentId: '',
        courseId: '',
        lecturerId: '',
        programId: '',
        semester: '',
        programYear: 1,
        status: 'enrolled'
      });
      fetchEnrollments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (enrollmentId, newStatus) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/api/enrollments/${enrollmentId}`, { status: newStatus });
      setSuccess('Enrollment status updated successfully');
      fetchEnrollments();
    } catch (err) {
      setError('Failed to update enrollment status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (enrollmentId) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/api/enrollments/${enrollmentId}`);
        setSuccess('Enrollment deleted successfully');
        fetchEnrollments();
      } catch (err) {
        setError('Failed to delete enrollment');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enrollment Management
      </Typography>

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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Enroll Student
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
              >
                {courses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.course_code} - {course.course_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Lecturer</InputLabel>
              <Select
                name="lecturerId"
                value={formData.lecturerId}
                onChange={handleChange}
                required
              >
                {lecturers.map((lecturer) => (
                  <MenuItem key={lecturer._id} value={lecturer._id}>
                    {lecturer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Program</InputLabel>
              <Select
                name="programId"
                value={formData.programId}
                onChange={handleChange}
                required
              >
                {programs.map((program) => (
                  <MenuItem key={program._id} value={program._id}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="semester"
              label="Semester"
              value={formData.semester}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              name="programYear"
              label="Program Year"
              type="number"
              value={formData.programYear}
              onChange={handleChange}
              required
              fullWidth
              inputProps={{ min: 1, max: 6 }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Enroll Student'}
          </Button>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Enrollments
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Lecturer</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Program Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment._id}>
                  <TableCell>{enrollment.student?.name}</TableCell>
                  <TableCell>
                    {enrollment.course?.course_code} - {enrollment.course?.course_name}
                  </TableCell>
                  <TableCell>{enrollment.lecturer?.name}</TableCell>
                  <TableCell>{enrollment.program?.name}</TableCell>
                  <TableCell>{enrollment.semester}</TableCell>
                  <TableCell>{enrollment.programYear}</TableCell>
                  <TableCell>
                    <Select
                      value={enrollment.status}
                      onChange={(e) => handleStatusChange(enrollment._id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="enrolled">Enrolled</MenuItem>
                      <MenuItem value="dropped">Dropped</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDelete(enrollment._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default EnrollmentManagement; 