import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const StudentCourseEnrollment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [currentEnrollments, setCurrentEnrollments] = useState([]);
  const [filters, setFilters] = useState({
    semester: '',
    programYear: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch available courses and current enrollments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Get courses that the student can enroll in
        const coursesResponse = await axios.get('/api/courses');
        setCourses(coursesResponse.data);
        setAvailableCourses(coursesResponse.data);
        
        // Get student's current enrollments
        const enrollmentsResponse = await axios.get('/api/enrollments');
        setCurrentEnrollments(enrollmentsResponse.data);
        
        // Remove already enrolled courses from available courses
        const enrolledCourseIds = enrollmentsResponse.data.map(enrollment => enrollment.courseId);
        const filteredCourses = coursesResponse.data.filter(
          course => !enrolledCourseIds.includes(course._id)
        );
        setAvailableCourses(filteredCourses);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          setError('Authentication error. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to load courses. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  // Filter courses based on selected filters and search term
  useEffect(() => {
    let filtered = [...courses];
    
    // Apply semester filter
    if (filters.semester) {
      filtered = filtered.filter(course => course.semester === filters.semester);
    }
    
    // Apply programYear filter
    if (filters.programYear) {
      filtered = filtered.filter(course => course.programYear === parseInt(filters.programYear));
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        course => 
          course.name.toLowerCase().includes(term) || 
          course.code.toLowerCase().includes(term) ||
          (course.faculty && course.faculty.toLowerCase().includes(term)) ||
          (course.department && course.department.toLowerCase().includes(term))
      );
    }
    
    // Remove already enrolled courses
    const enrolledCourseIds = currentEnrollments.map(enrollment => enrollment.courseId);
    filtered = filtered.filter(course => !enrolledCourseIds.includes(course._id));
    
    setAvailableCourses(filtered);
  }, [filters, searchTerm, courses, currentEnrollments]);
  
  // Enroll in a course
  const handleEnroll = async (courseId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('/api/enrollments', {
        courseId,
        semester: filters.semester || courses.find(c => c._id === courseId)?.semester,
        programYear: filters.programYear || courses.find(c => c._id === courseId)?.programYear,
        academicYear: filters.academicYear,
        status: 'enrolled'
      });
      
      setSuccess('Successfully enrolled in the course');
      
      // Update current enrollments
      setCurrentEnrollments([...currentEnrollments, response.data]);
      
      // Remove enrolled course from available courses
      setAvailableCourses(availableCourses.filter(course => course._id !== courseId));
      
    } catch (err) {
      console.error('Enrollment error:', err);
      
      if (err.response) {
        if (err.response.status === 403) {
          setError('Access denied. You do not have permission to enroll in this course.');
        } else if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(err.response.data?.message || 'Failed to enroll in the course.');
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
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      semester: '',
      programYear: '',
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    });
    setSearchTerm('');
  };
  
  return (
    <div className="w-full min-h-screen bg-gray-50 absolute top-0 left-0 right-0 m-0 p-0 overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 max-w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Course Enrollment</h1>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Year
              </label>
              <select
                name="programYear"
                value={filters.programYear}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                name="academicYear"
                value={filters.academicYear}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="2023-2024"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Courses
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by course name, code, faculty or department..."
            />
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
        
        {/* Available Courses */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Available Courses</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : availableCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No courses available for enrollment based on your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.map(course => (
                <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800">{course.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">Code: {course.code}</p>
                  <p className="text-sm text-gray-600">Semester: {course.semester}</p>
                  <p className="text-sm text-gray-600">Year: {course.programYear}</p>
                  {course.faculty && <p className="text-sm text-gray-600">Faculty: {course.faculty}</p>}
                  {course.department && <p className="text-sm text-gray-600">Department: {course.department}</p>}
                  
                  <button
                    onClick={() => handleEnroll(course._id)}
                    disabled={loading}
                    className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enroll Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Current Enrollments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Your Current Enrollments</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : currentEnrollments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You are not currently enrolled in any courses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentEnrollments.map(enrollment => {
                    const course = courses.find(c => c._id === enrollment.courseId) || {};
                    return (
                      <tr key={enrollment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{course.name || 'Unknown Course'}</div>
                          <div className="text-sm text-gray-500">{course.code || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.semester} (Year {enrollment.programYear})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.academicYear}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            enrollment.status === 'enrolled' ? 'bg-green-100 text-green-800' :
                            enrollment.status === 'dropped' ? 'bg-red-100 text-red-800' :
                            enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(enrollment.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCourseEnrollment; 