import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  IdentificationIcon,
  CalendarIcon,
  BookOpenIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    student_id: "",
    role: "student",
    year: "",
    semester: "",
    program_id: "",
    courses: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [error, setError] = useState("");
  const [programCourses, setProgramCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch programs, courses when component loads
    const fetchData = async () => {
      try {
        const [programsRes, coursesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/programs"),
          axios.get("http://localhost:5000/api/courses")
        ]);
        
        setPrograms(programsRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        setError("Failed to load data. Please try again.");
      }
    };
    
    fetchData();
  }, []);

  // Filter courses based on selected program
  useEffect(() => {
    if (formData.program_id) {
      const filtered = courses.filter(
        course => course.program_id === formData.program_id
      );
      setFilteredCourses(filtered);
      setProgramCourses(filtered);
    } else {
      setFilteredCourses([]);
      setProgramCourses([]);
    }
  }, [formData.program_id, courses]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCourseChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({
        ...formData,
        courses: [...formData.courses, value]
      });
    } else {
      setFormData({
        ...formData,
        courses: formData.courses.filter(course => course !== value)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Validate lecturer courses
      if (formData.role === 'lecturer' && (!formData.courses || formData.courses.length === 0)) {
        setError("Please select at least one course to teach");
        setIsLoading(false);
        return;
      }
      
      // Create user account
      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        program_id: formData.program_id,
        student_id: formData.role === "student" ? formData.student_id : undefined,
        courses: formData.courses,
        year: formData.year,
        semester: formData.semester
      };
      
      const res = await axios.post("http://localhost:5000/api/auth/register", userData);
      alert(res.data.msg);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join us today and start your journey
          </p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <UserIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
              <input
                type="text"
                name="first_name"
                required
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <UserIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
              <input
                type="text"
                name="last_name"
                required
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Last Name"
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
              <input
                type="email"
                name="email"
                required
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
              <input
                type="password"
                name="password"
                required
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                onChange={handleChange}
              />
            </div>
            
            <div className="relative">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
              </select>
            </div>
            
            {formData.role === "student" && (
              <div className="relative">
                <IdentificationIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
                <input
                  type="text"
                  name="student_id"
                  required
                  className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Student ID"
                  onChange={handleChange}
                />
              </div>
            )}
            
            <div className="relative">
              <AcademicCapIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
              <select
                name="program_id"
                value={formData.program_id}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select Program</option>
                {programs.map(program => (
                  <option key={program._id} value={program._id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <CalendarIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
              <input
                type="text"
                name="year"
                required
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Year"
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <BookOpenIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
              <input
                type="text"
                name="semester"
                required
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Semester"
                onChange={handleChange}
              />
            </div>
            
            {/* Show program courses information for students */}
            {formData.role === "student" && formData.program_id && programCourses.length > 0 && (
              <div className="rounded-lg border border-gray-300 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Courses you'll be enrolled in:
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {programCourses.map(course => (
                    <div key={course._id} className="flex items-center">
                      <span className="ml-2 block text-sm text-gray-900">
                        {course.course_code} - {course.course_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Only show course selection for lecturers */}
            {formData.role === "lecturer" && formData.program_id && filteredCourses.length > 0 && (
              <div className="rounded-lg border border-gray-300 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Courses to Teach: <span className="text-red-500">*</span>
                  <span className="ml-1 text-sm text-gray-500">(required)</span>
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filteredCourses.map(course => (
                    <div key={course._id} className="flex items-center">
                      <input
                        id={`course-${course._id}`}
                        name="courses"
                        type="checkbox"
                        value={course._id}
                        onChange={handleCourseChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`course-${course._id}`} className="ml-2 block text-sm text-gray-900">
                        {course.course_code} - {course.course_name}
                      </label>
                    </div>
                  ))}
                </div>
                {error && error.includes("course") && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;