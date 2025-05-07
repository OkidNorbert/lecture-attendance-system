import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../utils/axios";
import useRealTimeUpdates from "../hooks/useRealTimeUpdates";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttended: 0,
    totalSessions: 0,
    attendanceRate: 0
  });
  const [enrollmentData, setEnrollmentData] = useState({
    currentSemester: '',
    currentYear: '',
    enrollments: [],
    availableSemesters: [],
    isEnrollmentOpen: false
  });
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    semester: '',
    programYear: '',
    isLoading: false,
    error: null,
    success: null
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Setup WebSocket connection for real-time updates
  const { lastMessage } = useRealTimeUpdates('student-updates');

  // Function to fetch latest dashboard data
  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    const token = localStorage.getItem("token");
    
    if (!token) {
      setError("❌ No token found. Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      // Fetch all data in parallel including recent attendance
      const [userResponse, statsResponse, enrollmentsResponse, attendanceResponse] = await Promise.all([
        axios.get("/api/auth/me"),
        axios.get("/api/attendance/stats/student"),
        axios.get("/api/enrollments"),
        axios.get("/api/attendance/history")
      ]);

      // Process recent attendance records
      const recentAttendance = attendanceResponse.data
        .sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date))
        .slice(0, 3) // Get most recent 3 records
        .map(record => ({
          id: record._id,
          courseName: record.course_id?.course_name || 'Unknown Course',
          status: record.status,
          date: new Date(record.attendance_date),
          checkInTime: record.checkInTime ? new Date(record.checkInTime) : null
        }));

      setRecentActivity(recentAttendance);
      setUser(userResponse.data);
      
      // Set attendance stats
      if (statsResponse.data) {
        setStats({
          totalAttended: statsResponse.data.totalAttended || 0,
          totalSessions: statsResponse.data.totalSessions || 0,
          attendanceRate: statsResponse.data.attendanceRate || 0
        });
      }

      // Process enrollment data
      if (enrollmentsResponse.data?.length > 0) {
        const sortedEnrollments = [...enrollmentsResponse.data].sort((a, b) => 
          new Date(b.enrollmentDate) - new Date(a.enrollmentDate)
        );
        
        const latestEnrollment = sortedEnrollments[0];
        const currentSemester = parseInt(latestEnrollment.semester);
        const currentYear = latestEnrollment.programYear;
        const nextOptions = [];
        
        if (currentSemester < 2) {
          nextOptions.push({
            semester: (currentSemester + 1).toString(),
            programYear: currentYear,
            label: `Semester ${currentSemester + 1} (Year ${currentYear})`
          });
        } else {
          nextOptions.push({
            semester: "1",
            programYear: currentYear + 1,
            label: `Semester 1 (Year ${currentYear + 1})`
          });
        }
        
        setEnrollmentData({
          currentSemester: latestEnrollment.semester,
          currentYear: latestEnrollment.programYear,
          enrollments: sortedEnrollments,
          availableSemesters: nextOptions,
          isEnrollmentOpen: true
        });
      }

      if (!silent) setLoading(false);
      setError(null);
    } catch (err) {
      console.error("[ERROR] Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      if (!silent) setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'attendance_update' || 
        lastMessage?.type === 'enrollment_update') {
      fetchDashboardData(true);
    }
  }, [lastMessage]);

  const handleEnrollmentModalOpen = () => {
    // Set the default enrollment form values
    if (enrollmentData.availableSemesters.length > 0) {
      const nextOption = enrollmentData.availableSemesters[0];
      setEnrollmentForm({
        ...enrollmentForm,
        semester: nextOption.semester,
        programYear: nextOption.programYear
      });
    }
    setShowEnrollmentModal(true);
  };

  const handleEnrollmentModalClose = () => {
    setShowEnrollmentModal(false);
    setEnrollmentForm({
      ...enrollmentForm,
      error: null,
      success: null
    });
  };

  const handleEnrollmentSubmit = async () => {
    setEnrollmentForm({
      ...enrollmentForm,
      isLoading: true,
      error: null,
      success: null
    });

    try {
      // Submit enrollment request
      const response = await axios.post("/api/student/enroll", {
        semester: enrollmentForm.semester,
        programYear: enrollmentForm.programYear
      });

      // Handle success
      setEnrollmentForm({
        ...enrollmentForm,
        isLoading: false,
        success: "Successfully enrolled in new semester!"
      });

      // Refresh enrollment data after a short delay
      setTimeout(() => {
        // Reload the page to refresh all data
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("[DEBUG] Enrollment error:", err);
      setEnrollmentForm({
        ...enrollmentForm,
        isLoading: false,
        error: err.response?.data?.msg || "Failed to enroll. Please try again."
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-center text-red-600 mb-2">Error</h2>
          <p className="text-center text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 p-0 m-0">
      <div className="student-dashboard-content w-full p-4 md:p-6 box-border">
        <div className="student-dashboard-grid max-w-7xl mx-auto">
          {/* Header Section */}
          <header className="mb-8 bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-indigo-800">Student Dashboard</h1>
              <p className="text-indigo-600 mt-1">
                Welcome back, <span className="font-semibold">{user?.name}</span>
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button 
                onClick={() => navigate("/scan-qr")}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center"
              >
                <span className="mr-2">📸</span>
                Scan QR Code
              </button>
              
              <button 
                onClick={() => { localStorage.removeItem("token"); navigate("/"); }}
                className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition duration-200 flex items-center"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
            </div>
          </header>
          
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-emerald-100 font-medium">Attendance Rate</p>
                  <h3 className="text-4xl font-bold mt-2">{stats.attendanceRate}%</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${stats.attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 font-medium">Sessions Attended</p>
                  <h3 className="text-4xl font-bold mt-2">{stats.totalAttended}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <p className="mt-6 text-blue-100 font-medium">
                Out of {stats.totalSessions} total sessions
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-violet-100 font-medium">Student ID</p>
                  <h3 className="text-4xl font-bold mt-2">{user?.studentId || 'N/A'}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
              </div>
              <p className="mt-6 text-violet-100 font-medium">
                {user?.department || 'Department not specified'}
              </p>
            </div>
          </div>
          
          {/* Current Enrollment Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Current Enrollment</h2>
                <p className="text-sm text-gray-500">Your active semester registration</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-5 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-amber-700 text-xl">📚</span>
                  </div>
                  <h3 className="font-semibold text-amber-900">Current Semester</h3>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-amber-800">
                    {enrollmentData.currentSemester ? `Semester ${enrollmentData.currentSemester}` : 'Not enrolled'}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">Academic Year 2024/2025</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-700 text-xl">📅</span>
                  </div>
                  <h3 className="font-semibold text-blue-900">Program Year</h3>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-blue-800">
                    Year {enrollmentData.currentYear || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">Bachelor's Program</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-emerald-700 text-xl">➕</span>
                  </div>
                  <h3 className="font-semibold text-emerald-900">Course Enrollment</h3>
                </div>
                
                <div className="flex flex-col gap-2 mt-2">
                  <Link
                    to="/enroll-courses"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow hover:shadow-lg transition duration-300 text-center flex items-center justify-center gap-2"
                  >
                    <span>Self-Enroll in Courses</span>
                    <span className="text-xl">→</span>
                  </Link>
                  
                  {enrollmentData.isEnrollmentOpen && enrollmentData.availableSemesters.length > 0 && (
                    <button
                      onClick={handleEnrollmentModalOpen}
                      className="px-4 py-2.5 bg-white border-2 border-teal-500 text-teal-700 rounded-lg hover:bg-teal-50 transition duration-300 flex items-center justify-center gap-2"
                    >
                      <span>Next Semester Enrollment</span>
                      <span className="text-xl">+</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
                <p className="text-sm text-gray-500">Frequently used features</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link 
                to="/scan-qr" 
                className="group flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center mb-3 text-white transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📸</span>
                </div>
                <span className="text-indigo-800 font-medium group-hover:text-indigo-600 transition-colors duration-300">Scan QR</span>
              </Link>
              
              <Link 
                to="/attendance-history" 
                className="group flex flex-col items-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-3 text-white transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📜</span>
                </div>
                <span className="text-emerald-800 font-medium group-hover:text-emerald-600 transition-colors duration-300">History</span>
              </Link>
              
              <Link 
                to="/enroll-courses"
                className="group flex flex-col items-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center mb-3 text-white transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📚</span>
                </div>
                <span className="text-violet-800 font-medium group-hover:text-violet-600 transition-colors duration-300">Enroll</span>
              </Link>
              
              <Link 
                to="/profile" 
                className="group flex flex-col items-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-3 text-white transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">👤</span>
                </div>
                <span className="text-amber-800 font-medium group-hover:text-amber-600 transition-colors duration-300">Profile</span>
              </Link>
              
              <Link 
                to="/help"
                className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full flex items-center justify-center mb-3 text-white transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">❓</span>
                </div>
                <span className="text-blue-800 font-medium group-hover:text-blue-600 transition-colors duration-300">Help</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">📅</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                <p className="text-sm text-gray-500">Your latest attendance records</p>
              </div>
              <Link 
                to="/attendance-history"
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all duration-300"
              >
                <span>View All</span>
                <span>→</span>
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent attendance records found.
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className={`group border border-gray-100 rounded-lg p-4 hover:bg-gradient-to-r transition-all duration-300 ${
                      activity.status === 'present' 
                        ? 'hover:from-green-50 hover:to-emerald-50 hover:border-green-200'
                        : activity.status === 'late'
                        ? 'hover:from-amber-50 hover:to-yellow-50 hover:border-amber-200'
                        : 'hover:from-red-50 hover:to-pink-50 hover:border-red-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300 ${
                          activity.status === 'present'
                            ? 'bg-gradient-to-br from-green-100 to-emerald-200'
                            : activity.status === 'late'
                            ? 'bg-gradient-to-br from-amber-100 to-yellow-200'
                            : 'bg-gradient-to-br from-red-100 to-pink-200'
                        }`}>
                          <span className={`text-sm ${
                            activity.status === 'present'
                              ? 'text-green-600'
                              : activity.status === 'late'
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}>
                            {activity.status === 'present' ? '✓' : activity.status === 'late' ? '⏱' : '✕'}
                          </span>
                        </div>
                        <div>
                          <h4 className={`font-medium text-gray-800 group-hover:text-${
                            activity.status === 'present'
                              ? 'green'
                              : activity.status === 'late'
                              ? 'amber'
                              : 'red'
                          }-800 transition-colors duration-300`}>
                            {activity.courseName}
                          </h4>
                          <p className={`text-sm text-gray-500 group-hover:text-${
                            activity.status === 'present'
                              ? 'green'
                              : activity.status === 'late'
                              ? 'amber'
                              : 'red'
                          }-600`}>
                            {activity.status === 'present' 
                              ? 'Marked present'
                              : activity.status === 'late'
                              ? 'Marked late'
                              : 'Marked absent'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {activity.date.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        {activity.checkInTime && (
                          <p className="text-xs text-gray-400">
                            {activity.checkInTime.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={handleEnrollmentModalClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-5">Enroll for Next Semester</h3>
            
            {enrollmentForm.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                {enrollmentForm.error}
              </div>
            )}
            
            {enrollmentForm.success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
                {enrollmentForm.success}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Enrollment Options:
                </label>
                <div className="space-y-2">
                  {enrollmentData.availableSemesters.map((option, index) => (
                    <div 
                      key={index} 
                      className="flex items-center p-3 border border-indigo-100 rounded-lg bg-indigo-50"
                    >
                      <input
                        type="radio"
                        id={`option-${index}`}
                        name="enrollmentOption"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        checked={enrollmentForm.semester === option.semester && enrollmentForm.programYear === option.programYear}
                        onChange={() => setEnrollmentForm({
                          ...enrollmentForm,
                          semester: option.semester,
                          programYear: option.programYear
                        })}
                      />
                      <label htmlFor={`option-${index}`} className="ml-3 block text-sm font-medium text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">What happens next?</h4>
                <p className="text-sm text-gray-600">
                  By enrolling for the next semester, you'll be automatically enrolled in all courses for your program in that semester. Your attendance will be tracked for those courses.
                </p>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleEnrollmentModalClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEnrollmentSubmit}
                  disabled={enrollmentForm.isLoading || enrollmentForm.success}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow-md hover:shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrollmentForm.isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : "Confirm Enrollment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
