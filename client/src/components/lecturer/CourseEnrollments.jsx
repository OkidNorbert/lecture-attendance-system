import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';

const CourseEnrollments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('last_name');
  const [order, setOrder] = useState('asc');
  
  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      fetchEnrollments();
    }
  }, [courseId]);
  
  const fetchCourseData = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse(response.data);
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError('Failed to load course information');
    }
  };
  
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/enrollments?courseId=${courseId}`);
      setEnrollments(response.data || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to load student enrollment data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const sortedEnrollments = () => {
    // Filter by search term
    const filteredData = enrollments.filter(enrollment => {
      const student = enrollment.student || {};
      const searchString = `${student.first_name || ''} ${student.last_name || ''} ${student.email || ''} ${student.student_id || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
    
    // Sort by selected column
    return filteredData.sort((a, b) => {
      const aStudent = a.student || {};
      const bStudent = b.student || {};
      
      let aValue, bValue;
      
      switch (orderBy) {
        case 'first_name':
          aValue = aStudent.first_name || '';
          bValue = bStudent.first_name || '';
          break;
        case 'last_name':
          aValue = aStudent.last_name || '';
          bValue = bStudent.last_name || '';
          break;
        case 'email':
          aValue = aStudent.email || '';
          bValue = bStudent.email || '';
          break;
        case 'student_id':
          aValue = aStudent.student_id || '';
          bValue = bStudent.student_id || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'enrollmentDate':
          aValue = new Date(a.enrollmentDate || 0).getTime();
          bValue = new Date(b.enrollmentDate || 0).getTime();
          break;
        default:
          aValue = aStudent.last_name || '';
          bValue = bStudent.last_name || '';
      }
      
      const result = (aValue < bValue) ? -1 : (aValue > bValue) ? 1 : 0;
      return order === 'desc' ? -result : result;
    });
  };
  
  const handleExportData = async () => {
    try {
      // Request a CSV download from the backend
      const response = await axios.get(`/api/enrollments/export?courseId=${courseId}`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate a filename with course code if available
      const courseCode = course?.course_code || courseId;
      link.setAttribute('download', `enrollments_${courseCode}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting enrollments:', err);
      setError('Failed to export enrollment data');
    }
  };
  
  const handleViewAttendance = (studentId) => {
    navigate(`/course/${courseId}/student/${studentId}/attendance`);
  };
  
  const handleBack = () => {
    navigate('/lecturer');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Course Enrollments
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {course && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {course.course_name}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Chip label={`Code: ${course.course_code}`} variant="outlined" size="small" />
              <Chip label={`Program: ${course.program?.name || 'N/A'}`} variant="outlined" size="small" />
              <Chip label={`Credits: ${course.credits || 'N/A'}`} variant="outlined" size="small" />
              <Chip label={`Total Students: ${enrollments.length}`} color="primary" size="small" />
            </Box>
          </CardContent>
        </Card>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          placeholder="Search students..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '300px' }}
        />
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportData}
        >
          Export
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'student_id'}
                  direction={orderBy === 'student_id' ? order : 'asc'}
                  onClick={() => handleSort('student_id')}
                >
                  Student ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'first_name'}
                  direction={orderBy === 'first_name' ? order : 'asc'}
                  onClick={() => handleSort('first_name')}
                >
                  First Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'last_name'}
                  direction={orderBy === 'last_name' ? order : 'asc'}
                  onClick={() => handleSort('last_name')}
                >
                  Last Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? order : 'asc'}
                  onClick={() => handleSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'enrollmentDate'}
                  direction={orderBy === 'enrollmentDate' ? order : 'asc'}
                  onClick={() => handleSort('enrollmentDate')}
                >
                  Enrollment Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEnrollments().length > 0 ? (
              sortedEnrollments().map((enrollment) => {
                const student = enrollment.student || {};
                return (
                  <TableRow key={enrollment._id}>
                    <TableCell>{student.student_id || 'N/A'}</TableCell>
                    <TableCell>{student.first_name || 'N/A'}</TableCell>
                    <TableCell>{student.last_name || 'N/A'}</TableCell>
                    <TableCell>{student.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={enrollment.status || 'enrolled'} 
                        color={
                          enrollment.status === 'completed' ? 'success' :
                          enrollment.status === 'dropped' ? 'error' : 
                          'primary'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewAttendance(student._id)}
                          title="View Attendance"
                        >
                          <AssessmentIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          href={`mailto:${student.email}`}
                          title="Send Email"
                        >
                          <MailOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {searchTerm ? 'No students match your search criteria' : 'No students enrolled in this course'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CourseEnrollments; 