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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SchoolIcon from '@mui/icons-material/School';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import PeopleIcon from '@mui/icons-material/People';

// Import the LecturerCourseEnrollment component
import LecturerCourseEnrollment from './LecturerCourseEnrollment';

// TabPanel component for switching between tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`enrollment-tabpanel-${index}`}
      aria-labelledby={`enrollment-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Function for a11y props
function a11yProps(index) {
  return {
    id: `enrollment-tab-${index}`,
    'aria-controls': `enrollment-tabpanel-${index}`,
  };
}

const EnrollmentManagement = () => {
  // Add tab state
  const [tabValue, setTabValue] = useState(0);
  
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
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    status: 'enrolled'
  });
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredBulkCourses, setFilteredBulkCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resetAll, setResetAll] = useState(false);
  const [filters, setFilters] = useState({
    studentSearch: '',
    courseSearch: '',
    lecturerSearch: '',
    programId: '',
    semester: '',
    programYear: '',
    status: '',
    academicYear: ''
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkEnrollData, setBulkEnrollData] = useState({
    courseId: '',
    lecturerId: '',
    programId: '',
    semester: '',
    programYear: 1,
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    status: 'enrolled',
    students: []
  });
  // New state for admin features
  const [isAdmin, setIsAdmin] = useState(false);
  const [resetCourseDialogOpen, setResetCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [resetLecturerDialogOpen, setResetLecturerDialogOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [reassignLecturerDialogOpen, setReassignLecturerDialogOpen] = useState(false);
  const [reassignLecturerData, setReassignLecturerData] = useState({
    oldLecturerId: '',
    newLecturerId: '',
    courseId: '' // Optional, to limit to a specific course
  });

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchCourses();
    fetchLecturers();
    fetchPrograms();
    
    // Check if the current user is an admin
    const checkUserRole = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/me');
        console.log('Current user data:', response.data);
        const isUserAdmin = response.data.role === 'admin';
        console.log('Is user admin?', isUserAdmin);
        console.log('User role from API:', response.data.role);
        
        // Check local storage for comparison
        const storedRole = localStorage.getItem('userRole');
        console.log('User role in localStorage:', storedRole);
        
        // Log token information for debugging
        const token = localStorage.getItem('token');
        console.log('Token exists in localStorage:', !!token);
        if (token) {
          // Don't log the actual token for security reasons, just log that it exists
          console.log('Token length:', token.length);
          
          // Decode JWT token (only the payload which is not encrypted)
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedPayload = JSON.parse(window.atob(base64));
            console.log('Decoded token payload:', {
              role: decodedPayload.role,
              id: decodedPayload._id,
              exp: new Date(decodedPayload.exp * 1000).toLocaleString()
            });
          } catch (e) {
            console.error('Error decoding token:', e);
          }
        }
        
        setIsAdmin(isUserAdmin);
      } catch (err) {
        console.error('Error checking user role:', err);
      }
    };
    
    checkUserRole();
  }, []);

  useEffect(() => {
    if (!enrollments.length) {
      setFilteredEnrollments([]);
      return;
    }
    
    let filtered = [...enrollments];
    
    if (filters.studentSearch) {
      const search = filters.studentSearch.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const firstName = enrollment.student?.first_name?.toLowerCase() || '';
        const lastName = enrollment.student?.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`;
        const studentId = enrollment.student?.student_id?.toLowerCase() || '';
        return fullName.includes(search) || studentId.includes(search);
      });
    }
    
    if (filters.courseSearch) {
      const search = filters.courseSearch.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const courseName = enrollment.course?.course_name?.toLowerCase() || '';
        const courseCode = enrollment.course?.course_code?.toLowerCase() || '';
        return courseName.includes(search) || courseCode.includes(search);
      });
    }
    
    if (filters.lecturerSearch) {
      const search = filters.lecturerSearch.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const firstName = enrollment.lecturer?.first_name?.toLowerCase() || '';
        const lastName = enrollment.lecturer?.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`;
        return fullName.includes(search);
      });
    }
    
    if (filters.programId) {
      filtered = filtered.filter(enrollment => 
        enrollment.programId === filters.programId);
    }
    
    if (filters.semester) {
      filtered = filtered.filter(enrollment => 
        enrollment.semester === filters.semester);
    }
    
    if (filters.programYear) {
      filtered = filtered.filter(enrollment => 
        enrollment.programYear === Number(filters.programYear));
    }
    
    if (filters.status) {
      filtered = filtered.filter(enrollment => 
        enrollment.status === filters.status);
    }
    
    if (filters.academicYear) {
      filtered = filtered.filter(enrollment => 
        enrollment.academicYear === filters.academicYear);
    }
    
    setFilteredEnrollments(filtered);
  }, [enrollments, filters]);

  useEffect(() => {
    // Filter courses when program, semester or programYear changes
    if (formData.programId && formData.semester && formData.programYear) {
      console.log('All courses before filtering:', courses);
      console.log("Filtering with criteria:", {
        programId: formData.programId,
        semester: formData.semester,
        programYear: formData.programYear
      });
      
      // First, log all course program fields to help debug
      courses.forEach(course => {
        console.log(`Course ${course.course_code || course.code} program fields:`, {
          program: course.program,
          program_id: course.program_id,
          _id: course._id,
          semester: course.semester,
          programYear: course.programYear
        });
      });
      
      const filtered = courses.filter(course => {
        // Enhanced program matching logic - check all possible program ID formats
        let programMatch = false;
        
        // Check course.program directly (could be string ID or object)
        if (course.program) {
          if (typeof course.program === 'string') {
            programMatch = course.program === formData.programId;
          } else if (course.program._id) {
            programMatch = course.program._id === formData.programId;
          }
        }
        
        // Check course.program_id (could be string ID or object)
        if (!programMatch && course.program_id) {
          if (typeof course.program_id === 'string') {
            programMatch = course.program_id === formData.programId;
          } else if (course.program_id._id) {
            programMatch = course.program_id._id === formData.programId;
          }
        }
        
        // Log program matching details for debugging
        console.log(`Course ${course.course_code || course.code} program match:`, {
          programMatch,
          courseProgram: course.program,
          courseProgramId: course.program_id,
          formProgramId: formData.programId
        });
        
        // Convert semester to string for comparison
        const courseSemester = String(course.semester || '');
        const formSemester = String(formData.semester || '');
        const semesterMatch = courseSemester === formSemester;
        
        // For programYear, compare as numbers if possible
        let courseYear = course.programYear || course.program_year || course.year;
        let formYear = formData.programYear;
        
        // Convert to numbers if they're strings but contain numeric values
        if (typeof courseYear === 'string') {
          courseYear = !isNaN(parseInt(courseYear)) ? parseInt(courseYear) : courseYear;
        }
        if (typeof formYear === 'string') {
          formYear = !isNaN(parseInt(formYear)) ? parseInt(formYear) : formYear;
        }
        
        // Now compare - this will work for both number and string comparisons
        const yearMatch = courseYear === formYear;
        
        // Log matches for debugging
        console.log(`Course ${course.course_code || course.code} matching details:`, {
          programMatch,
          semesterMatch,
          yearMatch,
          courseSemester,
          formSemester,
          courseYear,
          formYear
        });
        
        return programMatch && semesterMatch && yearMatch;
      });
      
      console.log(`Found ${filtered.length} matching courses`);
      if (filtered.length > 0) {
        console.log("First matching course:", filtered[0]);
      } else {
        // If no matches, try more lenient matching for debugging
        const programMatches = courses.filter(c => {
          // Check all possible program fields and formats
          let programMatch = false;
          
          if (c.program) {
            if (typeof c.program === 'string') {
              programMatch = c.program === formData.programId;
            } else if (c.program._id) {
              programMatch = c.program._id === formData.programId;
            }
          }
          
          if (!programMatch && c.program_id) {
            if (typeof c.program_id === 'string') {
              programMatch = c.program_id === formData.programId;
            } else if (c.program_id._id) {
              programMatch = c.program_id._id === formData.programId;
            }
          }
          
          return programMatch;
        });
        
        console.log(`Found ${programMatches.length} courses matching only program`);
        
        if (programMatches.length > 0) {
          console.log("Program matches but not semester/year:", programMatches.map(c => ({
            id: c._id,
            code: c.course_code || c.code,
            semester: c.semester,
            semesterType: typeof c.semester,
            programYear: c.programYear,
            yearType: typeof c.programYear
          })));
        }
      }
      
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [formData.programId, formData.semester, formData.programYear, courses]);

  useEffect(() => {
    // Filter courses for bulk enrollment when program, semester or programYear changes
    if (bulkEnrollData.programId && bulkEnrollData.semester && bulkEnrollData.programYear) {
      console.log("Filtering bulk courses with criteria:", {
        programId: bulkEnrollData.programId,
        semester: bulkEnrollData.semester,
        programYear: bulkEnrollData.programYear
      });
      
      const filtered = courses.filter(course => {
        // Enhanced program matching logic - check all possible program ID formats
        let programMatch = false;
        
        // Check course.program directly (could be string ID or object)
        if (course.program) {
          if (typeof course.program === 'string') {
            programMatch = course.program === bulkEnrollData.programId;
          } else if (course.program._id) {
            programMatch = course.program._id === bulkEnrollData.programId;
          }
        }
        
        // Check course.program_id (could be string ID or object)
        if (!programMatch && course.program_id) {
          if (typeof course.program_id === 'string') {
            programMatch = course.program_id === bulkEnrollData.programId;
          } else if (course.program_id._id) {
            programMatch = course.program_id._id === bulkEnrollData.programId;
          }
        }
        
        // Convert semester to string for comparison
        const courseSemester = String(course.semester || '');
        const formSemester = String(bulkEnrollData.semester || '');
        const semesterMatch = courseSemester === formSemester;
        
        // For programYear, compare as numbers if possible
        let courseYear = course.programYear || course.program_year || course.year;
        let formYear = bulkEnrollData.programYear;
        
        // Convert to numbers if they're strings but contain numeric values
        if (typeof courseYear === 'string') {
          courseYear = !isNaN(parseInt(courseYear)) ? parseInt(courseYear) : courseYear;
        }
        if (typeof formYear === 'string') {
          formYear = !isNaN(parseInt(formYear)) ? parseInt(formYear) : formYear;
        }
        
        // Now compare - this will work for both number and string comparisons
        const yearMatch = courseYear === formYear;
        
        return programMatch && semesterMatch && yearMatch;
      });
      
      console.log(`Found ${filtered.length} matching courses for bulk enrollment`);
      
      // If no matches found, log more details for debugging
      if (filtered.length === 0) {
        const programMatches = courses.filter(c => {
          // Check all possible program fields and formats
          let programMatch = false;
          
          if (c.program) {
            if (typeof c.program === 'string') {
              programMatch = c.program === bulkEnrollData.programId;
            } else if (c.program._id) {
              programMatch = c.program._id === bulkEnrollData.programId;
            }
          }
          
          if (!programMatch && c.program_id) {
            if (typeof c.program_id === 'string') {
              programMatch = c.program_id === bulkEnrollData.programId;
            } else if (c.program_id._id) {
              programMatch = c.program_id._id === bulkEnrollData.programId;
            }
          }
          
          return programMatch;
        });
        
        console.log(`Found ${programMatches.length} courses matching only program for bulk enrollment`);
        
        if (programMatches.length > 0) {
          console.log("Program matches for bulk but not semester/year:", programMatches.map(c => ({
            id: c._id,
            code: c.course_code || c.code,
            semester: c.semester,
            semesterType: typeof c.semester,
            programYear: c.programYear || c.program_year || c.year,
            yearType: typeof c.programYear
          })));
        }
      }
      
      setFilteredBulkCourses(filtered);
    } else {
      setFilteredBulkCourses([]);
    }
  }, [bulkEnrollData.programId, bulkEnrollData.semester, bulkEnrollData.programYear, courses]);

  // Fix the useEffect hook for student selection to properly handle programId
  useEffect(() => {
    // When a student is selected, automatically set their program
    if (formData.studentId) {
      console.log("Student selected:", formData.studentId);
      const selectedStudent = students.find(student => student._id === formData.studentId);
      
      if (selectedStudent) {
        console.log("Found student data:", selectedStudent);
        
        // Check for programId directly in the student object
        if (selectedStudent.programId) {
          console.log("Setting program from student.programId:", selectedStudent.programId);
          setFormData(prevData => ({
            ...prevData,
            programId: selectedStudent.programId
          }));
        } 
        // Check for program_id as an alternative property
        else if (selectedStudent.program_id) {
          console.log("Setting program from student.program_id:", selectedStudent.program_id);
          setFormData(prevData => ({
            ...prevData,
            programId: selectedStudent.program_id
          }));
        }
        // Check for program._id as an alternative
        else if (selectedStudent.program && selectedStudent.program._id) {
          console.log("Setting program from student.program._id:", selectedStudent.program._id);
          setFormData(prevData => ({
            ...prevData,
            programId: selectedStudent.program._id
          }));
        } else {
          console.warn("Student has no program information:", selectedStudent);
        }
      } else {
        console.warn("Selected student not found in students array");
      }
    }
  }, [formData.studentId, students]);

  // Add an effect to auto-select a course when program, semester and year are set
  useEffect(() => {
    // When program, semester and year are all set, try to auto-select a course
    if (formData.programId && formData.semester && formData.programYear) {
      console.log("Program criteria set, looking for courses:", {
        programId: formData.programId,
        semester: formData.semester,
        programYear: formData.programYear
      });
      
      // If we filtered some courses and there's no course selected yet
      if (filteredCourses.length > 0 && !formData.courseId) {
        // Select the first available course
        const firstCourse = filteredCourses[0];
        console.log("Auto-selecting course:", firstCourse);
        
        // Create updates object
        const updates = { courseId: firstCourse._id };
        
        // If course has lecturers, select the first one
        if (Array.isArray(firstCourse.lecturers) && firstCourse.lecturers.length > 0) {
          if (typeof firstCourse.lecturers[0] === 'object' && firstCourse.lecturers[0]._id) {
            updates.lecturerId = firstCourse.lecturers[0]._id;
          } else {
            updates.lecturerId = firstCourse.lecturers[0];
          }
          console.log("Auto-selecting lecturer from course:", updates.lecturerId);
        } else {
          // Try to find a lecturer for this course
          const courseLecturers = lecturers.filter(lecturer => 
            lecturer.taught_courses && lecturer.taught_courses.includes(firstCourse._id)
          );
          
          if (courseLecturers.length > 0) {
            updates.lecturerId = courseLecturers[0]._id;
            console.log("Auto-selecting lecturer from taught_courses:", updates.lecturerId);
          } else if (lecturers.length > 0) {
            updates.lecturerId = lecturers[0]._id;
            console.log("Auto-selecting default lecturer:", updates.lecturerId);
          }
        }
        
        // Apply the updates
        setFormData(prevData => ({
          ...prevData,
          ...updates
        }));
      }
    }
  }, [formData.programId, formData.semester, formData.programYear, filteredCourses, lecturers]);

  // Add a function to set default semester and program year
  const setDefaultSemesterAndYear = () => {
    // Only set defaults if values aren't already set
    const updates = {};
    let needsUpdate = false;
    
    // Default semester based on current month
    if (!formData.semester) {
      const currentMonth = new Date().getMonth();
      
      if (currentMonth >= 0 && currentMonth <= 3) {
        // January to April: Semester 2
        updates.semester = '2';
      } else if (currentMonth >= 4 && currentMonth <= 7) {
        // May to August: Semester 3
        updates.semester = '3';
      } else {
        // September to December: Semester 1
        updates.semester = '1';
      }
      needsUpdate = true;
    }
    
    // Default program year to 1 if not set
    if (!formData.programYear) {
      updates.programYear = 1;
      needsUpdate = true;
    }
    
    // Apply updates if needed
    if (needsUpdate) {
      console.log('Setting default semester and program year:', updates);
      setFormData(prevData => ({
        ...prevData,
        ...updates
      }));
      return true;
    }
    
    return false;
  };

  // Modify the useEffect for program to also set defaults
  useEffect(() => {
    // When a program is set but semester/year are not, set defaults
    if (formData.programId && (!formData.semester || !formData.programYear)) {
      setDefaultSemesterAndYear();
    }
  }, [formData.programId, formData.semester, formData.programYear]);

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
      console.log('Fetched students:', response.data);
      
      // Process students to ensure we have program information
      const processedStudents = response.data.map(student => {
        // If the student doesn't have explicit programId, check for alternatives
        if (!student.programId && student.program && student.program._id) {
          return {
            ...student,
            programId: student.program._id
          };
        }
        return student;
      });
      
      setStudents(processedStudents);
      console.log('Processed students data:', processedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
    }
  };

  const fetchCourses = async () => {
    try {
      // Get courses with lecturer information included
      const response = await axiosInstance.get('/api/courses');
      console.log('Fetched courses:', response.data);
      
      // Debug function to check course data structure
      const debugCourseStructure = (courses) => {
        if (!courses || courses.length === 0) {
          console.log('No courses data available to analyze');
          return;
        }
        
        const sampleCourse = courses[0];
        console.log('Sample course structure:', {
          keys: Object.keys(sampleCourse),
          programField: sampleCourse.program || 'not found',
          program_idField: sampleCourse.program_id || 'not found',
          semesterField: sampleCourse.semester,
          semesterType: typeof sampleCourse.semester,
          yearFields: {
            programYear: sampleCourse.programYear || 'not found',
            program_year: sampleCourse.program_year || 'not found',
            year: sampleCourse.year || 'not found'
          }
        });
        
        // Count courses per program
        const programCounts = courses.reduce((acc, course) => {
          const programId = course.program || course.program_id;
          if (programId) {
            acc[programId] = (acc[programId] || 0) + 1;
          }
          return acc;
        }, {});
        
        console.log('Courses per program:', programCounts);
        
        // Log semesters and years
        const semesters = [...new Set(courses.map(c => c.semester))];
        const years = [...new Set(courses.map(c => c.programYear || c.program_year || c.year).filter(Boolean))];
        
        console.log('Available semesters:', semesters);
        console.log('Available years:', years);
      };
      
      // Process the courses to ensure all have proper format 
      const processedCourses = response.data.map(course => {
        // Extract program ID regardless of format
        let programId = null;
        if (typeof course.program === 'string') {
          programId = course.program;
        } else if (course.program && course.program._id) {
          programId = course.program._id;
        } else if (typeof course.program_id === 'string') {
          programId = course.program_id;
        } else if (course.program_id && course.program_id._id) {
          programId = course.program_id._id;
        }

        // Normalize semester as string and programYear as number
        const normalizedSemester = course.semester ? String(course.semester) : '';
        const normalizedProgramYear = course.programYear ? 
          Number(course.programYear) : 
          (course.program_year ? Number(course.program_year) : 
            (course.year ? Number(course.year) : null));
        
        return {
          ...course,
          // Store both program and program_id fields consistently
          program: programId,
          program_id: programId,
          // Ensure lecturers is always an array
          lecturers: Array.isArray(course.lecturers) ? course.lecturers : [],
          // Normalize semester to string format
          semester: normalizedSemester,
          // Normalize programYear to number format
          programYear: normalizedProgramYear,
          // Store original values for debugging
          _original_semester: course.semester,
          _original_programYear: course.programYear || course.program_year || course.year,
          _original_program: course.program,
          _original_program_id: course.program_id
        };
      });
      
      console.log('Processed courses with normalized data:', 
        processedCourses.map(c => ({
          id: c._id,
          code: c.course_code || c.code,
          semester: c.semester,
          semesterType: typeof c.semester,
          programYear: c.programYear,
          yearType: typeof c.programYear,
          program: c.program
        }))
      );
      
      // Debug the course structure
      debugCourseStructure(processedCourses);
      
      setCourses(processedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
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

  // Add a function to fetch student details directly by ID
  const fetchStudentDetails = async (studentId) => {
    try {
      console.log('Fetching details for student:', studentId);
      const response = await axiosInstance.get(`/api/users/${studentId}`);
      console.log('Student details response:', response.data);
      
      if (response.data) {
        const studentData = response.data;
        
        // Update the form with student's program information
        const updates = {};
        
        // Try to find program ID from various possible locations
        if (studentData.programId) {
          updates.programId = studentData.programId;
        } else if (studentData.program_id) {
          updates.programId = studentData.program_id;
        } else if (studentData.program && studentData.program._id) {
          updates.programId = studentData.program._id;
        }
        
        if (updates.programId) {
          console.log('Setting programId from API call:', updates.programId);
          
          // Update the form data with the program
          setFormData(prevData => ({
            ...prevData,
            ...updates
          }));
          
          return true;
        } else {
          console.warn('Student API response has no program information:', studentData);
          return false;
        }
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      return false;
    }
    
    return false;
  };

  // Update the student selection handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update the field that changed
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // If student is selected, get their program and set default values
    if (name === 'studentId' && value) {
      console.log("Student selected in handleChange:", value);
      
      // First try with local data
      const selectedStudent = students.find(student => student._id === value);
      let programFound = false;
      
      if (selectedStudent) {
        console.log("Found student data in handleChange:", selectedStudent);
        
        // Create an object to update multiple fields
        const updates = {
          courseId: '',
          lecturerId: ''
        };
        
        // Check various places where program ID might be stored
        if (selectedStudent.programId) {
          updates.programId = selectedStudent.programId;
          console.log("Setting programId from student:", selectedStudent.programId);
          programFound = true;
        } else if (selectedStudent.program_id) {
          updates.programId = selectedStudent.program_id;
          console.log("Setting program_id from student:", selectedStudent.program_id);
          programFound = true;
        } else if (selectedStudent.program && selectedStudent.program._id) {
          updates.programId = selectedStudent.program._id;
          console.log("Setting program._id from student:", selectedStudent.program._id);
          programFound = true;
        }
        
        // Apply the updates
        setFormData(prevData => ({
          ...prevData,
          ...updates
        }));
        
        // Set default semester and year
        setTimeout(() => {
          setDefaultSemesterAndYear();
        }, 100);
      }
      
      // If program not found locally, try API call
      if (!programFound) {
        fetchStudentDetails(value).then(success => {
          if (success) {
            // Set default semester and year after student details are loaded
            setTimeout(() => {
              setDefaultSemesterAndYear();
            }, 100);
          }
        });
      }
    }
    
    // Reset courseId when program, semester or programYear changes
    if (name === 'programId' || name === 'semester' || name === 'programYear') {
      setFormData(prevData => ({
        ...prevData,
        courseId: '',
        lecturerId: ''
      }));
    }
    
    // If the user selects a course, automatically set the lecturer
    if (name === 'courseId' && value) {
      const selectedCourse = courses.find(course => course._id === value);
      if (selectedCourse) {
        if (Array.isArray(selectedCourse.lecturers) && selectedCourse.lecturers.length > 0) {
          // Extract the lecturer ID properly
          const lecturerId = typeof selectedCourse.lecturers[0] === 'object' 
            ? selectedCourse.lecturers[0]._id 
            : selectedCourse.lecturers[0];
          
          // Use the first lecturer associated with the course
          setFormData(prevData => ({
            ...prevData,
            lecturerId: lecturerId
          }));
          console.log('Course selected, setting lecturer:', lecturerId);
        } else {
          console.warn('Selected course has no lecturers assigned:', selectedCourse.course_code);
          // Try to find lecturers who teach this course
          const courseLecturers = lecturers.filter(lecturer => 
            lecturer.taught_courses && lecturer.taught_courses.includes(selectedCourse._id)
          );
          
          if (courseLecturers.length > 0) {
            setFormData(prevData => ({
              ...prevData,
              lecturerId: courseLecturers[0]._id
            }));
            console.log('Found lecturer through course assignments:', courseLecturers[0]._id);
          } else if (lecturers.length > 0) {
            // If no matching lecturer found, use the first available lecturer
            setFormData(prevData => ({
              ...prevData,
              lecturerId: lecturers[0]._id
            }));
            console.log('Using first available lecturer as fallback:', lecturers[0]._id);
          } else {
            // Reset lecturerId if no lecturer is found
            setFormData(prevData => ({
              ...prevData,
              lecturerId: ''
            }));
          }
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Create a copy of the form data for submission
      const submissionData = { ...formData };
      
      // Log initial state
      console.log('Initial submission data:', submissionData);
      
      // ENSURE ALL FIELDS ARE SET BEFORE SUBMISSION
      
      // 1. If lecturerId is not set but courseId is, try to fetch the lecturer from the course
      if (!submissionData.lecturerId && submissionData.courseId) {
        const selectedCourse = courses.find(course => course._id === submissionData.courseId);
        if (selectedCourse && Array.isArray(selectedCourse.lecturers) && selectedCourse.lecturers.length > 0) {
          // Make sure we're getting just the ID string
          if (typeof selectedCourse.lecturers[0] === 'object' && selectedCourse.lecturers[0]._id) {
            submissionData.lecturerId = selectedCourse.lecturers[0]._id;
          } else {
            submissionData.lecturerId = selectedCourse.lecturers[0];
          }
          console.log('Setting lecturer from course:', submissionData.lecturerId);
        }
      }
      
      // 2. If still no lecturerId, try to find a lecturer who teaches this course
      if (!submissionData.lecturerId && submissionData.courseId && lecturers.length > 0) {
        const lecturerForCourse = lecturers.find(lecturer => 
          lecturer.taught_courses && lecturer.taught_courses.includes(submissionData.courseId)
        );
        
        if (lecturerForCourse) {
          submissionData.lecturerId = lecturerForCourse._id;
          console.log('Setting lecturer from taught_courses:', submissionData.lecturerId);
        } else if (lecturers.length > 0) {
          // If no specific lecturer found, use the first one as a fallback
          submissionData.lecturerId = lecturers[0]._id;
          console.log('Setting default lecturer as fallback:', submissionData.lecturerId);
        }
      }
      
      // 3. Additional validation for programId
      if (!submissionData.programId && submissionData.studentId) {
        const selectedStudent = students.find(student => student._id === submissionData.studentId);
        if (selectedStudent && selectedStudent.programId) {
          submissionData.programId = selectedStudent.programId;
          console.log('Setting program from student:', submissionData.programId);
        }
      }
      
      // 4. Final check for essential fields - if missing, try to set defaults
      // Default semester based on current month
      if (!submissionData.semester) {
        const currentMonth = new Date().getMonth();
        
        if (currentMonth >= 0 && currentMonth <= 3) {
          // January to April: Semester 2
          submissionData.semester = '2';
        } else if (currentMonth >= 4 && currentMonth <= 7) {
          // May to August: Semester 3
          submissionData.semester = '3';
        } else {
          // September to December: Semester 1
          submissionData.semester = '1';
        }
        console.log('Setting default semester:', submissionData.semester);
      }
      
      // Default program year to 1 if not set
      if (!submissionData.programYear) {
        submissionData.programYear = 1;
        console.log('Setting default program year:', submissionData.programYear);
      }
      
      // Log each field's value after our fixes
      console.log('Field values after fixes:');
      console.log('- studentId:', submissionData.studentId, typeof submissionData.studentId);
      console.log('- courseId:', submissionData.courseId, typeof submissionData.courseId);
      console.log('- lecturerId:', submissionData.lecturerId, typeof submissionData.lecturerId);
      console.log('- programId:', submissionData.programId, typeof submissionData.programId);
      console.log('- semester:', submissionData.semester, typeof submissionData.semester);
      console.log('- programYear:', submissionData.programYear, typeof submissionData.programYear);
      
      // Check if all required fields are present
      const requiredFields = ['studentId', 'courseId', 'programId', 'semester', 'programYear', 'academicYear', 'lecturerId'];
      const missingFields = requiredFields.filter(field => !submissionData[field]);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        console.error('Missing fields:', missingFields, 'Current data:', submissionData);
        setLoading(false);
        return;
      }
      
      // Proceed with enrollment
      console.log('Final enrollment data being sent:', submissionData);
      const response = await axiosInstance.post('/api/enrollments', submissionData);
      console.log('Enrollment response:', response.data);
      
      setSuccess('Student enrolled successfully');
      setFormData({
        studentId: '',
        courseId: '',
        lecturerId: '',
        programId: '',
        semester: '',
        programYear: 1,
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        status: 'enrolled'
      });
      fetchEnrollments();
    } catch (err) {
      console.error('Enrollment error:', err);
      
      // Log more detailed error information
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
        userRole: isAdmin ? 'admin' : 'non-admin'
      });
      
      // Check for different error types
      if (err.response) {
        setError(err.response.data?.message || 'Failed to enroll student');
      } else if (err.request) {
        setError('No response from server. Please check your internet connection.');
      } else {
        setError('An error occurred while processing your request: ' + err.message);
      }
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

  const openResetDialog = (student = null) => {
    setSelectedStudent(student);
    setResetAll(!student);
    setResetDialogOpen(true);
  };

  const handleResetEnrollments = async () => {
    try {
      setLoading(true);
      const endpoint = resetAll 
        ? '/api/enrollments/reset-all'
        : `/api/enrollments/reset-student/${selectedStudent._id}`;
      
      await axiosInstance.post(endpoint);
      
      setSuccess(resetAll 
        ? 'All student enrollments have been reset' 
        : `Enrollments for ${selectedStudent.name || selectedStudent.first_name} have been reset`);
      
      fetchEnrollments();
      setResetDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      studentSearch: '',
      courseSearch: '',
      lecturerSearch: '',
      programId: '',
      semester: '',
      programYear: '',
      status: '',
      academicYear: ''
    });
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleBulkEnrollOpen = () => {
    setBulkEnrollOpen(true);
    handleMenuClose();
  };
  
  const handleBulkEnrollClose = () => {
    setBulkEnrollOpen(false);
  };

  // Group enrollments by student
  const groupedEnrollments = filteredEnrollments.reduce((acc, enrollment) => {
    const studentId = enrollment.studentId || (enrollment.student && enrollment.student._id);
    if (!studentId) return acc;
    
    if (!acc[studentId]) {
      acc[studentId] = {
        student: enrollment.student,
        enrollments: []
      };
    }
    acc[studentId].enrollments.push(enrollment);
    return acc;
  }, {});

  const handleBulkEnrollChange = (e) => {
    const { name, value } = e.target;
    setBulkEnrollData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset courseId when program, semester or programYear changes
    if (name === 'programId' || name === 'semester' || name === 'programYear') {
      setBulkEnrollData(prev => ({
        ...prev,
        courseId: '',
        lecturerId: ''
      }));
    }
    
    // If the user selects a course, automatically set the lecturer
    if (name === 'courseId' && value) {
      const selectedCourse = courses.find(course => course._id === value);
      if (selectedCourse) {
        if (Array.isArray(selectedCourse.lecturers) && selectedCourse.lecturers.length > 0) {
          // Extract the lecturer ID properly
          const lecturerId = typeof selectedCourse.lecturers[0] === 'object' 
            ? selectedCourse.lecturers[0]._id 
            : selectedCourse.lecturers[0];
          
          // Use the first lecturer associated with the course
          setBulkEnrollData(prev => ({
            ...prev,
            lecturerId: lecturerId
          }));
          console.log('Bulk enrollment - Course selected, setting lecturer:', lecturerId);
        } else {
          console.warn('Bulk enrollment - Selected course has no lecturers assigned:', selectedCourse.course_code);
          // Try to find lecturers who teach this course
          const courseLecturers = lecturers.filter(lecturer => 
            lecturer.taught_courses && lecturer.taught_courses.includes(selectedCourse._id)
          );
          
          if (courseLecturers.length > 0) {
            setBulkEnrollData(prev => ({
              ...prev,
              lecturerId: courseLecturers[0]._id
            }));
            console.log('Bulk enrollment - Found lecturer through course assignments:', courseLecturers[0]._id);
          } else if (lecturers.length > 0) {
            // If no matching lecturer found, use the first available lecturer
            setBulkEnrollData(prev => ({
              ...prev,
              lecturerId: lecturers[0]._id
            }));
            console.log('Bulk enrollment - Using first available lecturer as fallback:', lecturers[0]._id);
          } else {
            // Reset lecturerId if no lecturer is found
            setBulkEnrollData(prev => ({
              ...prev,
              lecturerId: ''
            }));
          }
        }
      }
    }
  };

  const handleStudentSelectionChange = (e) => {
    const selectedIds = e.target.value;
    setBulkEnrollData(prev => ({
      ...prev,
      students: selectedIds
    }));
    
    // Check if all selected students are from the same program
    if (selectedIds.length > 0) {
      const selectedStudentsData = selectedIds.map(id => students.find(s => s._id === id));
      const programIds = [...new Set(selectedStudentsData.map(s => s.programId).filter(Boolean))];
      
      // If all students have the same program, set it automatically
      if (programIds.length === 1) {
        setBulkEnrollData(prev => ({
          ...prev,
          programId: programIds[0],
          courseId: '',
          lecturerId: ''
        }));
      } else if (programIds.length > 1) {
        // If students are from different programs, reset program selection
        setBulkEnrollData(prev => ({
          ...prev,
          programId: '',
          courseId: '',
          lecturerId: ''
        }));
      }
    }
  };

  const handleBulkEnrollSubmit = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Create a copy of the form data for submission
      const submissionData = { ...bulkEnrollData };
      
      console.log('Initial bulk enrollment data:', submissionData);
      
      // ENHANCED COURSE AND LECTURER HANDLING
      
      // 1. If courseId is not set but programId, semester, and programYear are, try to find an appropriate course
      if (!submissionData.courseId && submissionData.programId && submissionData.semester && submissionData.programYear) {
        const filteredCourses = courses.filter(course => 
          course.program === submissionData.programId && 
          String(course.semester) === String(submissionData.semester) && 
          (String(course.year) === String(submissionData.programYear) || String(course.program_year) === String(submissionData.programYear))
        );
        
        if (filteredCourses.length > 0) {
          submissionData.courseId = filteredCourses[0]._id;
          console.log('Bulk enrollment - Found and set courseId:', submissionData.courseId);
        }
      }
      
      // 2. If lecturerId is not set but courseId is, try to fetch the lecturer from the course
      if (!submissionData.lecturerId && submissionData.courseId) {
        const selectedCourse = courses.find(course => course._id === submissionData.courseId);
        if (selectedCourse && Array.isArray(selectedCourse.lecturers) && selectedCourse.lecturers.length > 0) {
          // Handle both object and string lecturer IDs
          if (typeof selectedCourse.lecturers[0] === 'object' && selectedCourse.lecturers[0]._id) {
            submissionData.lecturerId = selectedCourse.lecturers[0]._id;
          } else {
            submissionData.lecturerId = selectedCourse.lecturers[0];
          }
          console.log('Bulk enrollment - Setting lecturer from course:', submissionData.lecturerId);
        }
      }
      
      // 3. If still no lecturerId but we have courses and lecturers, find one that teaches this course
      if (!submissionData.lecturerId && submissionData.courseId && lecturers.length > 0) {
        const lecturerForCourse = lecturers.find(lecturer => 
          lecturer.taught_courses && lecturer.taught_courses.includes(submissionData.courseId)
        );
        
        if (lecturerForCourse) {
          submissionData.lecturerId = lecturerForCourse._id;
          console.log('Bulk enrollment - Setting lecturer from taught courses:', submissionData.lecturerId);
        } else if (lecturers.length > 0) {
          // If no specific lecturer found, use the first one as a fallback
          submissionData.lecturerId = lecturers[0]._id;
          console.log('Bulk enrollment - Setting default lecturer as fallback:', submissionData.lecturerId);
        }
      }
      
      // 4. Additional validation for programId if not set but students are selected
      if (!submissionData.programId && submissionData.students.length > 0) {
        const selectedStudentsData = submissionData.students.map(id => students.find(s => s._id === id));
        const programIds = [...new Set(selectedStudentsData.map(s => s.programId).filter(Boolean))];
        
        if (programIds.length === 1) {
          submissionData.programId = programIds[0];
          console.log('Bulk enrollment - Setting program from student selection:', submissionData.programId);
        }
      }
      
      // Log the enhanced submission data
      console.log('Enhanced bulk enrollment data:', {
        courseId: submissionData.courseId,
        lecturerId: submissionData.lecturerId,
        programId: submissionData.programId,
        semester: submissionData.semester,
        students: submissionData.students.length
      });
      
      // Validate required fields
      if (!submissionData.courseId) {
        setError('Course selection is required');
        setLoading(false);
        return;
      }
      
      if (!submissionData.lecturerId) {
        setError('Lecturer information is missing. Please select a course with an assigned lecturer.');
        setLoading(false);
        return;
      }
      
      if (!submissionData.programId) {
        setError('Program selection is required');
        setLoading(false);
        return;
      }
      
      if (!submissionData.semester) {
        setError('Semester selection is required');
        setLoading(false);
        return;
      }
      
      if (submissionData.students.length === 0) {
        setError('Please select at least one student');
        setLoading(false);
        return;
      }
      
      // Create an array of enrollment objects
      let successCount = 0;
      let failedCount = 0;
      const failedStudents = [];
      
      // Process enrollments one by one to catch individual errors
      for (const studentId of submissionData.students) {
        try {
          // Create enrollment data for each student
          const enrollmentData = {
            studentId,
            courseId: submissionData.courseId,
            lecturerId: submissionData.lecturerId,
            programId: submissionData.programId,
            semester: submissionData.semester,
            programYear: submissionData.programYear,
            academicYear: submissionData.academicYear,
            status: submissionData.status
          };
          
          // Check for existing enrollment
          const existingEnrollment = enrollments.find(enrollment => 
            enrollment.studentId === studentId && 
            enrollment.courseId === submissionData.courseId &&
            enrollment.semester === submissionData.semester &&
            enrollment.academicYear === submissionData.academicYear
          );
          
          if (existingEnrollment) {
            failedCount++;
            const student = students.find(s => s._id === studentId);
            const studentName = student ? `${student.first_name} ${student.last_name}` : studentId;
            failedStudents.push({
              id: studentId, 
              name: studentName,
              error: 'Student is already enrolled in this course'
            });
            continue;
          }
          
          // Make the enrollment request
          await axiosInstance.post('/api/enrollments', enrollmentData);
          successCount++;
        } catch (err) {
          failedCount++;
          const student = students.find(s => s._id === studentId);
          const studentName = student ? `${student.first_name} ${student.last_name}` : studentId;
          failedStudents.push({
            id: studentId, 
            name: studentName,
            error: err.response?.data?.message || 'Unknown error'
          });
        }
      }
      
      // Show appropriate success/error message
      if (successCount > 0 && failedCount === 0) {
        setSuccess(`Successfully enrolled all ${successCount} students`);
        fetchEnrollments();
        handleBulkEnrollClose();
      } else if (successCount > 0 && failedCount > 0) {
        setSuccess(`Successfully enrolled ${successCount} students, but failed to enroll ${failedCount} students`);
        setError(`Failed to enroll the following students: ${failedStudents.map(s => s.name).join(', ')}`);
        fetchEnrollments();
      } else {
        setError(`Failed to enroll any students. Please check permissions and try again.`);
      }
      
      // Reset form
      setBulkEnrollData({
        courseId: '',
        lecturerId: '',
        programId: '',
        semester: '',
        programYear: 1,
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        status: 'enrolled',
        students: []
      });
      
    } catch (err) {
      console.error('Bulk enrollment error:', err);
      
      if (err.response) {
        if (err.response.status === 403) {
          setError('Access denied. You do not have permission to perform bulk enrollment.');
        } else if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else {
          setError(err.response.data?.message || 'Failed to enroll students. Check your permissions.');
        }
      } else if (err.request) {
        setError('No response from server. Please check your internet connection.');
      } else {
        setError('An error occurred: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset enrollments for a specific course
  const openResetCourseDialog = (course) => {
    setSelectedCourse(course);
    setResetCourseDialogOpen(true);
  };
  
  const handleResetCourseEnrollments = async () => {
    try {
      setLoading(true);
      
      await axiosInstance.post(`/api/enrollments/reset-course/${selectedCourse._id}`);
      
      setSuccess(`Enrollments for course ${selectedCourse.course_name || selectedCourse.course_code} have been reset`);
      
      fetchEnrollments();
      setResetCourseDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset course enrollments');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset enrollments for a specific lecturer
  const openResetLecturerDialog = (lecturer) => {
    setSelectedLecturer(lecturer);
    setResetLecturerDialogOpen(true);
  };
  
  const handleResetLecturerEnrollments = async () => {
    try {
      setLoading(true);
      
      await axiosInstance.post(`/api/enrollments/reset-lecturer/${selectedLecturer._id}`);
      
      setSuccess(`Enrollments for lecturer ${selectedLecturer.name || selectedLecturer.first_name + ' ' + selectedLecturer.last_name} have been reset`);
      
      fetchEnrollments();
      setResetLecturerDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset lecturer enrollments');
    } finally {
      setLoading(false);
    }
  };
  
  // Reassign lecturer for enrollments
  const openReassignLecturerDialog = () => {
    setReassignLecturerData({
      oldLecturerId: '',
      newLecturerId: '',
      courseId: ''
    });
    setReassignLecturerDialogOpen(true);
    handleMenuClose();
  };
  
  const handleReassignLecturerChange = (e) => {
    const { name, value } = e.target;
    setReassignLecturerData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleReassignLecturer = async () => {
    try {
      setLoading(true);
      
      if (!reassignLecturerData.oldLecturerId || !reassignLecturerData.newLecturerId) {
        setError('Both original and new lecturer must be selected');
        setLoading(false);
        return;
      }
      
      const response = await axiosInstance.put('/api/enrollments/reassign-lecturer', reassignLecturerData);
      
      setSuccess(`Successfully reassigned ${response.data.count} enrollments`);
      
      fetchEnrollments();
      setReassignLecturerDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign lecturer enrollments');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Add a debug function to check student data
  const debugStudentData = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (student) {
      console.log("Student found:", student);
      console.log("Student properties:", Object.keys(student));
      console.log("Program info:", {
        programId: student.programId,
        program_id: student.program_id,
        program: student.program
      });
    } else {
      console.log("Student not found with ID:", studentId);
    }
  };

  // Add a useEffect to log courses after they're loaded
  useEffect(() => {
    if (courses.length > 0) {
      console.log(`Loaded ${courses.length} courses`);
      
      // Log some sample course data
      const programIds = [...new Set(courses.map(course => course.program || course.program_id).filter(Boolean))];
      console.log(`Found courses with ${programIds.length} different programs`);
      
      // Get course data for the first three programs
      const programSamples = programIds.slice(0, 3).map(programId => {
        const programCourses = courses.filter(course => 
          (course.program === programId) || (course.program_id === programId)
        );
        const program = programs.find(p => p._id === programId);
        return {
          programId,
          programName: program?.name || 'Unknown',
          courseCount: programCourses.length,
          sampleCourse: programCourses[0]
        };
      });
      
      console.log('Program course samples:', programSamples);
    }
  }, [courses, programs]);

  // Add this function after debugStudentData
  const debugCourseData = () => {
    // Log courses data structure
    console.log("Debugging Course Data Structure");
    
    // Check for course structure
    if (courses.length > 0) {
      const sampleCourse = courses[0];
      console.log("Sample course:", sampleCourse);
      console.log("semester type:", typeof sampleCourse.semester);
      console.log("programYear type:", typeof sampleCourse.programYear);
      console.log("program field:", sampleCourse.program);
      console.log("program_id field:", sampleCourse.program_id);
      
      // Group courses by semester to see all available values
      const semesterValues = {};
      courses.forEach(course => {
        const semester = course.semester;
        if (!semesterValues[semester]) {
          semesterValues[semester] = [];
        }
        semesterValues[semester].push({
          id: course._id,
          code: course.course_code || course.code,
          name: course.course_name || course.name,
          semester: semester,
          programYear: course.programYear,
          program: course.program || course.program_id
        });
      });
      console.log("Courses by semester:", semesterValues);
      
      // Try to understand how programs are stored
      const programValues = {};
      courses.forEach(course => {
        let programId = null;
        
        // Try to extract program ID from various possible fields
        if (course.program && typeof course.program === 'string') {
          programId = course.program;
        } else if (course.program && course.program._id) {
          programId = course.program._id;
        } else if (course.program_id && typeof course.program_id === 'string') {
          programId = course.program_id;
        } else if (course.program_id && course.program_id._id) {
          programId = course.program_id._id;
        }
        
        if (programId) {
          if (!programValues[programId]) {
            programValues[programId] = [];
          }
          programValues[programId].push({
            id: course._id,
            code: course.course_code || course.code,
            name: course.course_name || course.name
          });
        }
      });
      console.log("Courses by program:", programValues);
      
      // Create a popup alert with summary info
      alert(`Found ${courses.length} courses
Sample course semester: ${sampleCourse.semester} (${typeof sampleCourse.semester})
Sample course programYear: ${sampleCourse.programYear} (${typeof sampleCourse.programYear})
Sample course program: ${JSON.stringify(sampleCourse.program || sampleCourse.program_id)}
Number of different semester values: ${Object.keys(semesterValues).length}
Number of different program values: ${Object.keys(programValues).length}`);
    } else {
      console.log("No courses available to analyze");
      alert("No courses available to analyze");
    }
  };

  // Define debugCourseStructure function
  const debugCourseStructure = (courses) => {
    if (!courses || courses.length === 0) {
      console.log('No courses data available to analyze');
      return;
    }
    
    const sampleCourse = courses[0];
    console.log('Sample course structure:', {
      keys: Object.keys(sampleCourse),
      programField: sampleCourse.program || 'not found',
      program_idField: sampleCourse.program_id || 'not found',
      semesterField: sampleCourse.semester,
      semesterType: typeof sampleCourse.semester,
      yearFields: {
        programYear: sampleCourse.programYear || 'not found',
        program_year: sampleCourse.program_year || 'not found',
        year: sampleCourse.year || 'not found'
      }
    });
    
    // Count courses per program
    const programCounts = courses.reduce((acc, course) => {
      const programId = course.program || course.program_id;
      if (programId) {
        acc[programId] = (acc[programId] || 0) + 1;
      }
      return acc;
    }, {});
    
    console.log('Courses per program:', programCounts);
    
    // Log semesters and years
    const semesters = [...new Set(courses.map(c => c.semester))];
    const years = [...new Set(courses.map(c => c.programYear || c.program_year || c.year).filter(Boolean))];
    
    console.log('Available semesters:', semesters);
    console.log('Available years:', years);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Enrollment Management
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="enrollment management tabs"
          variant="fullWidth"
        >
          <Tab 
            label="Student Enrollments" 
            icon={<PeopleIcon />} 
            iconPosition="start" 
            {...a11yProps(0)} 
          />
          <Tab 
            label="Lecturer Course Assignments" 
            icon={<LocalLibraryIcon />} 
            iconPosition="start" 
            {...a11yProps(1)} 
          />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {(success || error) && (
          <Box sx={{ mb: 2 }}>
            {success && <Alert severity="success">{success}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Add New Enrollment</Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    label="Student"
                    required
                  >
                    <MenuItem value="">Select Student</MenuItem>
                    {students.map((student) => {
                      const studentProgram = programs.find(p => p._id === student.programId);
                      return (
                      <MenuItem key={student._id} value={student._id}>
                        {student.first_name} {student.last_name}
                          {studentProgram && (
                            <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                              ({studentProgram.code})
                            </Box>
                          )}
                      </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Program</InputLabel>
                  <Select
                    name="programId"
                    value={formData.programId}
                    onChange={handleChange}
                    label="Program"
                    required
                    disabled={!!formData.studentId}
                  >
                    <MenuItem value="">Select Program</MenuItem>
                    {programs.map((program) => (
                      <MenuItem key={program._id} value={program._id}>
                        {program.name} ({program.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    label="Semester"
                    required
                  >
                    <MenuItem value="">Select Semester</MenuItem>
                    <MenuItem value="1">Semester 1</MenuItem>
                    <MenuItem value="2">Semester 2</MenuItem>
                    <MenuItem value="3">Semester 3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    name="programYear"
                    value={formData.programYear}
                    onChange={handleChange}
                    label="Year"
                    required
                  >
                    <MenuItem value="">Select Year</MenuItem>
                    <MenuItem value={1}>Year 1</MenuItem>
                    <MenuItem value={2}>Year 2</MenuItem>
                    <MenuItem value={3}>Year 3</MenuItem>
                    <MenuItem value={4}>Year 4</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={12}>
                {/* Debug button row */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
                  <Button 
                    size="small"
                    variant="outlined"
                    color="info"
                    onClick={() => {
                      console.log('Current form data:', formData);
                      console.log('All courses:', courses);
                      console.log('Filtered courses:', filteredCourses);
                      
                      // Check if courses and program data match
                      if (formData.programId) {
                        const programName = programs.find(p => p._id === formData.programId)?.name || 'Unknown';
                        console.log(`Selected program: ${programName} (${formData.programId})`);
                        
                        // Find all courses for this program and log them
                        const programCourses = courses.filter(course => {
                          if (typeof course.program === 'string') {
                            return course.program === formData.programId;
                          } else if (course.program && course.program._id) {
                            return course.program._id === formData.programId;
                          } else if (typeof course.program_id === 'string') {
                            return course.program_id === formData.programId;
                          } else if (course.program_id && course.program_id._id) {
                            return course.program_id._id === formData.programId;
                          }
                          return false;
                        });
                        
                        console.log(`Found ${programCourses.length} courses for this program`);
                        programCourses.forEach(course => {
                          console.log(`Course: ${course.course_code || course.code}`, {
                            semester: course.semester,
                            semesterType: typeof course.semester,
                            programYear: course.programYear,
                            yearType: typeof course.programYear,
                            program: course.program,
                            program_id: course.program_id
                          });
                        });
                        
                        alert(`Program: ${programName}
Found ${programCourses.length} courses for this program
Selected semester: ${formData.semester} (${typeof formData.semester})
Selected year: ${formData.programYear} (${typeof formData.programYear})
Matched courses: ${filteredCourses.length}`);
                      }
                    }}
                  >
                    Debug Course Filtering
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Course</InputLabel>
                  <Select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    label="Course"
                    required
                    disabled={!formData.programId || !formData.semester || !formData.programYear}
                  >
                    <MenuItem value="">Select Course</MenuItem>
                    {formData.programId && formData.semester && formData.programYear ? (
                      filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => {
                          let courseLecturer = null;
                          
                          if (Array.isArray(course.lecturers) && course.lecturers.length > 0) {
                            // Handle both object lecturers and ID-only lecturers
                            if (typeof course.lecturers[0] === 'object') {
                              courseLecturer = course.lecturers[0];
                            } else {
                              // If it's just an ID, find the lecturer from the lecturers array
                              courseLecturer = lecturers.find(l => l._id === course.lecturers[0]);
                            }
                          }
                          
                          return (
                            <MenuItem key={course._id} value={course._id}>
                              <Box>
                                {course.course_code} - {course.course_name}
                                {courseLecturer && (
                                  <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                                    Lecturer: {courseLecturer.first_name} {courseLecturer.last_name}
                                  </Typography>
                                )}
                                {(!Array.isArray(course.lecturers) || course.lecturers.length === 0) && (
                                  <Typography variant="caption" component="div" sx={{ color: 'error.main' }}>
                                    Warning: No lecturer assigned
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          );
                        })
                      ) : (
                        <MenuItem disabled value="">
                          <Box>
                            <Typography component="div" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                              No courses found for the selected criteria
                            </Typography>
                            <Typography variant="caption" component="div">
                              Program: {programs.find(p => p._id === formData.programId)?.name || formData.programId}
                            </Typography>
                            <Typography variant="caption" component="div">
                              Semester: {formData.semester}, Year: {formData.programYear}
                            </Typography>
                            <Typography variant="caption" component="div" sx={{ mt: 1, fontStyle: 'italic' }}>
                              Try changing the semester or program year
                            </Typography>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              sx={{ mt: 1, fontSize: '0.7rem' }} 
                              onClick={(e) => {
                                e.stopPropagation();
                                debugCourseData();
                              }}
                            >
                              Debug Course Filter
                            </Button>
                          </Box>
                        </MenuItem>
                      )
                    ) : (
                      <MenuItem disabled value="">
                        Select program, semester and year first
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Academic Year"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                    required
                  >
                    <MenuItem value="enrolled">Enrolled</MenuItem>
                    <MenuItem value="dropped">Dropped</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 1, height: '53px' }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Add Enrollment"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Enrollment List</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleBulkEnrollOpen}
              sx={{ mr: 1 }}
            >
              Bulk Enroll
            </Button>
            <IconButton
              onClick={handleMenuOpen}
              aria-label="menu"
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={openReassignLecturerDialog}>
                <ListItemIcon>
                  <SwapHorizIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Reassign Lecturer</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => openResetDialog(null)}>
                <ListItemIcon>
                  <RestartAltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Reset All Enrollments</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <TextField
              label="Search Students"
              name="studentSearch"
              value={filters.studentSearch}
              onChange={handleFilterChange}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              label="Search Courses"
              name="courseSearch"
              value={filters.courseSearch}
              onChange={handleFilterChange}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              label="Search Lecturers"
              name="lecturerSearch"
              value={filters.lecturerSearch}
              onChange={handleFilterChange}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <Button
              variant="outlined"
              color="primary"
              onClick={resetFilters}
              startIcon={<FilterListIcon />}
              sx={{ minWidth: '120px' }}
            >
              Clear
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredEnrollments.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Lecturer</TableCell>
                  <TableCell>Program</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Academic Year</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment._id}>
                    <TableCell>
                      {enrollment.student ? 
                        `${enrollment.student.first_name} ${enrollment.student.last_name}` 
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {enrollment.course ? 
                        `${enrollment.course.course_code} - ${enrollment.course.course_name}` 
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {enrollment.lecturer ? 
                        `${enrollment.lecturer.first_name} ${enrollment.lecturer.last_name}` 
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {enrollment.program ? enrollment.program.name : 'Unknown'}
                    </TableCell>
                    <TableCell>{enrollment.semester}</TableCell>
                    <TableCell>{enrollment.programYear}</TableCell>
                    <TableCell>{enrollment.academicYear}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={enrollment.status}
                          onChange={(e) => handleStatusChange(enrollment._id, e.target.value)}
                          variant="outlined"
                          size="small"
                        >
                          <MenuItem value="enrolled">Enrolled</MenuItem>
                          <MenuItem value="dropped">Dropped</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(enrollment._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              No enrollments found or no enrollment match your search criteria.
            </Typography>
          </Paper>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <LecturerCourseEnrollment />
      </TabPanel>

      {/* Add dialog components */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Enrollments</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedStudent ? 
              `Are you sure you want to delete all enrollments for ${selectedStudent.first_name} ${selectedStudent.last_name}?` :
              "Are you sure you want to delete ALL enrollments in the system? This action cannot be undone."
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleResetEnrollments} color="error" variant="contained">
            {selectedStudent ? "Delete Student Enrollments" : "Delete All"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Enrollment Dialog */}
      <Dialog open={bulkEnrollOpen} onClose={handleBulkEnrollClose} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Enrollment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select students and a course to enroll them all at once. When selecting students from the same program, 
            the program will be automatically detected.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Students</InputLabel>
                <Select
                  multiple
                  name="students"
                  value={bulkEnrollData.students}
                  onChange={handleStudentSelectionChange}
                  label="Students"
                  required
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((studentId) => {
                        const student = students.find(s => s._id === studentId);
                        const program = programs.find(p => p._id === student?.programId);
                        return (
                          <Chip 
                            key={studentId} 
                            label={student ? 
                              `${student.first_name} ${student.last_name}${program ? ` (${program.code})` : ''}` 
                              : 'Unknown'} 
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {students.map((student) => {
                    const studentProgram = programs.find(p => p._id === student.programId);
                    return (
                    <MenuItem key={student._id} value={student._id}>
                      {student.first_name} {student.last_name}
                        {studentProgram && (
                          <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                            ({studentProgram.code})
                          </Box>
                        )}
                    </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              
              {bulkEnrollData.students.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {(() => {
                    const selectedStudentsData = bulkEnrollData.students.map(id => students.find(s => s._id === id));
                    const programIds = [...new Set(selectedStudentsData.map(s => s.programId).filter(Boolean))];
                    
                    if (programIds.length === 1) {
                      const program = programs.find(p => p._id === programIds[0]);
                      return (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          All selected students are enrolled in the {program?.name || 'same'} program.
                        </Alert>
                      );
                    } else if (programIds.length > 1) {
                      return (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Selected students are from different programs. Please ensure you select the appropriate program.
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Program</InputLabel>
                <Select
                  name="programId"
                  value={bulkEnrollData.programId}
                  onChange={handleBulkEnrollChange}
                  label="Program"
                  required
                  disabled={bulkEnrollData.students.length > 0 && 
                            [...new Set(bulkEnrollData.students
                              .map(id => students.find(s => s._id === id)?.programId)
                              .filter(Boolean))].length === 1}
                >
                  <MenuItem value="">Select Program</MenuItem>
                  {programs.map((program) => (
                    <MenuItem key={program._id} value={program._id}>
                      {program.name} ({program.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Semester</InputLabel>
                <Select
                  name="semester"
                  value={bulkEnrollData.semester}
                  onChange={handleBulkEnrollChange}
                  label="Semester"
                  required
                >
                  <MenuItem value="">Select Semester</MenuItem>
                  <MenuItem value="1">Semester 1</MenuItem>
                  <MenuItem value="2">Semester 2</MenuItem>
                  <MenuItem value="3">Semester 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Program Year"
                name="programYear"
                type="number"
                value={bulkEnrollData.programYear}
                onChange={handleBulkEnrollChange}
                sx={{ mb: 2 }}
                InputProps={{ inputProps: { min: 1, max: 6 } }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Course</InputLabel>
                <Select
                  name="courseId"
                  value={bulkEnrollData.courseId}
                  onChange={handleBulkEnrollChange}
                  label="Course"
                  required
                  disabled={!bulkEnrollData.programId || !bulkEnrollData.semester || !bulkEnrollData.programYear}
                >
                  <MenuItem value="">Select Course</MenuItem>
                  {bulkEnrollData.programId && bulkEnrollData.semester && bulkEnrollData.programYear ? (
                    filteredBulkCourses.length > 0 ? (
                      filteredBulkCourses.map((course) => {
                        let courseLecturer = null;
                        
                        if (Array.isArray(course.lecturers) && course.lecturers.length > 0) {
                          // Handle both object lecturers and ID-only lecturers
                          if (typeof course.lecturers[0] === 'object') {
                            courseLecturer = course.lecturers[0];
                          } else {
                            // If it's just an ID, find the lecturer from the lecturers array
                            courseLecturer = lecturers.find(l => l._id === course.lecturers[0]);
                          }
                        }
                        
                        return (
                          <MenuItem key={course._id} value={course._id}>
                            <Box>
                              {course.course_code} - {course.course_name}
                              {courseLecturer && (
                                <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                                  Lecturer: {courseLecturer.first_name} {courseLecturer.last_name}
                                </Typography>
                              )}
                              {(!Array.isArray(course.lecturers) || course.lecturers.length === 0) && (
                                <Typography variant="caption" component="div" sx={{ color: 'error.main' }}>
                                  Warning: No lecturer assigned
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        );
                      })
                    ) : (
                      <MenuItem disabled value="">
                        <Box>
                          <Typography component="div" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            No courses found for the selected criteria
                          </Typography>
                          <Typography variant="caption" component="div">
                            Program: {programs.find(p => p._id === bulkEnrollData.programId)?.name || bulkEnrollData.programId}
                          </Typography>
                          <Typography variant="caption" component="div">
                            Semester: {bulkEnrollData.semester}, Year: {bulkEnrollData.programYear}
                          </Typography>
                          <Typography variant="caption" component="div" sx={{ mt: 1, fontStyle: 'italic' }}>
                            Try changing the semester or program year
                          </Typography>
                        </Box>
                      </MenuItem>
                    )
                  ) : (
                    <MenuItem disabled value="">
                      Select program, semester and year first
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Academic Year"
                name="academicYear"
                value={bulkEnrollData.academicYear}
                onChange={handleBulkEnrollChange}
                sx={{ mb: 2 }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkEnrollClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleBulkEnrollSubmit} 
            color="primary" 
            variant="contained"
            disabled={loading || !bulkEnrollData.courseId || !bulkEnrollData.programId || bulkEnrollData.students.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : "Enroll Students"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Course Dialog */}
      <Dialog open={resetCourseDialogOpen} onClose={() => setResetCourseDialogOpen(false)}>
        <DialogTitle>Reset Course Enrollments</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedCourse ? 
              `Are you sure you want to delete all enrollments for course ${selectedCourse.course_name}?` :
              "Please select a course first."
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetCourseDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleResetCourseEnrollments} 
            color="error" 
            variant="contained"
            disabled={!selectedCourse}
          >
            Delete Course Enrollments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Lecturer Dialog */}
      <Dialog open={resetLecturerDialogOpen} onClose={() => setResetLecturerDialogOpen(false)}>
        <DialogTitle>Reset Lecturer Enrollments</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedLecturer ? 
              `Are you sure you want to delete all enrollments for lecturer ${selectedLecturer.first_name} ${selectedLecturer.last_name}?` :
              "Please select a lecturer first."
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetLecturerDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleResetLecturerEnrollments} 
            color="error" 
            variant="contained"
            disabled={!selectedLecturer}
          >
            Delete Lecturer Enrollments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reassign Lecturer Dialog */}
      <Dialog open={reassignLecturerDialogOpen} onClose={() => setReassignLecturerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reassign Lecturer</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Move enrollments from one lecturer to another. You can optionally limit to a specific course.
          </DialogContentText>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Old Lecturer</InputLabel>
            <Select
              name="oldLecturerId"
              value={reassignLecturerData.oldLecturerId}
              onChange={handleReassignLecturerChange}
              label="Old Lecturer"
              required
            >
              <MenuItem value="">Select Lecturer</MenuItem>
              {lecturers.map((lecturer) => (
                <MenuItem key={lecturer._id} value={lecturer._id}>
                  {lecturer.first_name} {lecturer.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Lecturer</InputLabel>
            <Select
              name="newLecturerId"
              value={reassignLecturerData.newLecturerId}
              onChange={handleReassignLecturerChange}
              label="New Lecturer"
              required
            >
              <MenuItem value="">Select Lecturer</MenuItem>
              {lecturers.map((lecturer) => (
                <MenuItem key={lecturer._id} value={lecturer._id}
                  disabled={lecturer._id === reassignLecturerData.oldLecturerId}
                >
                  {lecturer.first_name} {lecturer.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Course (Optional)</InputLabel>
            <Select
              name="courseId"
              value={reassignLecturerData.courseId}
              onChange={handleReassignLecturerChange}
              label="Course (Optional)"
            >
              <MenuItem value="">All Courses</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course._id} value={course._id}>
                  {course.course_code} - {course.course_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReassignLecturerDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleReassignLecturer} 
            color="primary" 
            variant="contained"
            disabled={!reassignLecturerData.oldLecturerId || !reassignLecturerData.newLecturerId}
          >
            Reassign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnrollmentManagement; 