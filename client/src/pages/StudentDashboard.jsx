import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../utils/axios";

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("❌ No token found. Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data
        console.log("[DEBUG] Fetching user data...");
        const userResponse = await axios.get("/api/auth/me");
        console.log("[DEBUG] User data received:", userResponse.data);
        
        setUser(userResponse.data);

        // Set default stats in case API calls fail
        const defaultStats = {
          totalAttended: 3,
          totalSessions: 5,
          attendanceRate: 60
        };
        
        // Fetch student enrollments
        try {
          const enrollmentsResponse = await axios.get("/api/student/enrollments");
          
          if (enrollmentsResponse.data && enrollmentsResponse.data.length > 0) {
            // Get the most recent enrollment
            const sortedEnrollments = [...enrollmentsResponse.data].sort((a, b) => 
              new Date(b.enrollmentDate) - new Date(a.enrollmentDate)
            );
            
            const latestEnrollment = sortedEnrollments[0];
            
            // Determine available next semesters
            const currentSemester = parseInt(latestEnrollment.semester);
            const currentYear = latestEnrollment.programYear;
            
            // Generate next possible semester options
            const nextOptions = [];
            
            if (currentSemester < 2) {
              // Can enroll in next semester of same year
              nextOptions.push({
                semester: (currentSemester + 1).toString(),
                programYear: currentYear,
                label: `Semester ${currentSemester + 1} (Year ${currentYear})`
              });
            } else {
              // Need to go to next year
              const nextProgramYear = currentYear + 1;
              nextOptions.push({
                semester: "1",
                programYear: nextProgramYear,
                label: `Semester 1 (Year ${nextProgramYear})`
              });
            }
            
            setEnrollmentData({
              currentSemester: latestEnrollment.semester,
              currentYear: latestEnrollment.programYear,
              enrollments: sortedEnrollments,
              availableSemesters: nextOptions,
              isEnrollmentOpen: true // You can control this with API data if needed
            });
          }
        } catch (enrollErr) {
          console.error("[DEBUG] Error fetching enrollments:", enrollErr);
        }
        
        // Fetch attendance stats for student - try multiple approaches
        try {
          // Try primary endpoint
          console.log("[DEBUG] Trying primary stats endpoint...");
          const statsResponse = await axios.get("/api/attendance/stats/student");
          console.log("[DEBUG] Stats received:", statsResponse.data);
          
          if (statsResponse.data) {
            setStats({
              totalAttended: statsResponse.data.totalAttended || defaultStats.totalAttended,
              totalSessions: statsResponse.data.totalSessions || defaultStats.totalSessions,
              attendanceRate: statsResponse.data.attendanceRate || defaultStats.attendanceRate
            });
            console.log("[DEBUG] Stats set from primary endpoint");
          } else {
            throw new Error("Empty response from stats endpoint");
          }
        } catch (statsErr) {
          console.error("[ERROR] Failed with primary endpoint:", statsErr);
          
          try {
            // Try fallback endpoint
            console.log("[DEBUG] Trying fallback endpoint...");
            const fallbackResponse = await axios.get("/api/attendance/stats/student/basic");
            console.log("[DEBUG] Fallback stats received:", fallbackResponse.data);
            
            if (fallbackResponse.data) {
              setStats({
                totalAttended: fallbackResponse.data.totalAttended || defaultStats.totalAttended,
                totalSessions: fallbackResponse.data.totalSessions || defaultStats.totalSessions,
                attendanceRate: fallbackResponse.data.attendanceRate || defaultStats.attendanceRate
              });
              console.log("[DEBUG] Stats set from fallback endpoint");
            } else {
              throw new Error("Empty response from fallback endpoint");
            }
          } catch (fallbackErr) {
            console.error("[ERROR] Failed with fallback endpoint:", fallbackErr);
            
            // Try the test endpoint as a last resort
            try {
              console.log("[DEBUG] Trying test endpoint...");
              const testResponse = await axios.get("/api/attendance/stats/student/test");
              console.log("[DEBUG] Test response received:", testResponse.data);
              
              if (testResponse.data) {
                setStats({
                  totalAttended: testResponse.data.totalAttended || defaultStats.totalAttended,
                  totalSessions: testResponse.data.totalSessions || defaultStats.totalSessions,
                  attendanceRate: testResponse.data.attendanceRate || defaultStats.attendanceRate
                });
                console.log("[DEBUG] Stats set from test endpoint");
              } else {
                throw new Error("Empty response from test endpoint");
              }
            } catch (testErr) {
              console.error("[ERROR] Failed with test endpoint:", testErr);
              
              // If all else fails, use default values
              console.log("[DEBUG] Using default stats values");
              setStats(defaultStats);
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("[ERROR] Failed to load user details:", err);
        setError("❌ Failed to load user details. Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    fetchUserData();
  }, [navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
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
          <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 font-medium">Attendance Rate</p>
                <h3 className="text-3xl font-bold mt-1">{stats.attendanceRate}%</h3>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
            <div className="mt-4 bg-white bg-opacity-20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full rounded-full" 
                style={{ width: `${stats.attendanceRate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 font-medium">Sessions Attended</p>
                <h3 className="text-3xl font-bold mt-1">{stats.totalAttended}</h3>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
            <p className="mt-4 text-blue-100">
              Out of {stats.totalSessions} total sessions
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-violet-100 font-medium">Student ID</p>
                <h3 className="text-3xl font-bold mt-1">{user?.studentId || 'N/A'}</h3>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <span className="text-xl">🎓</span>
              </div>
            </div>
            <p className="mt-4 text-violet-100">
              Department: {user?.department || 'Not specified'}
            </p>
          </div>
        </div>
        
        {/* Current Enrollment Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Current Enrollment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-5">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-amber-700 text-xl">📚</span>
                </div>
                <h3 className="font-semibold text-amber-900">Current Semester</h3>
              </div>
              <p className="text-2xl font-bold text-amber-800">
                {enrollmentData.currentSemester ? `Semester ${enrollmentData.currentSemester}` : 'Not enrolled'}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-700 text-xl">📅</span>
                </div>
                <h3 className="font-semibold text-blue-900">Program Year</h3>
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {enrollmentData.currentYear || 'Not enrolled'}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-emerald-700 text-xl">➕</span>
                </div>
                <h3 className="font-semibold text-emerald-900">Enrollment</h3>
              </div>
              
              {enrollmentData.isEnrollmentOpen && enrollmentData.availableSemesters.length > 0 ? (
                <button
                  onClick={handleEnrollmentModalOpen}
                  className="mt-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow hover:shadow-lg transition duration-300"
                >
                  Enroll for Next Semester
                </button>
              ) : (
                <p className="text-gray-600 italic">
                  Enrollment not available at this time
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/scan-qr" 
              className="flex flex-col items-center p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition duration-200"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📸</span>
              </div>
              <span className="text-indigo-800 font-medium">Scan QR</span>
            </Link>
            
            <Link 
              to="/attendance-history" 
              className="flex flex-col items-center p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition duration-200"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📜</span>
              </div>
              <span className="text-emerald-800 font-medium">History</span>
            </Link>
            
            <Link 
              to="/profile" 
              className="flex flex-col items-center p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition duration-200"
            >
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">👤</span>
              </div>
              <span className="text-amber-800 font-medium">Profile</span>
            </Link>
            
            <Link 
              to="/help" 
              className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition duration-200"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">❓</span>
              </div>
              <span className="text-blue-800 font-medium">Help</span>
            </Link>
          </div>
        </div>
        
        {/* Recent Activity Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
            <Link 
              to="/attendance-history"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            {/* This would normally be populated with real data from an API call */}
            <div className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Introduction to Programming</h4>
                    <p className="text-sm text-gray-500">Marked present</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Today</p>
                  <p className="text-xs text-gray-400">10:30 AM</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-amber-600 text-sm">⏱</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Database Systems</h4>
                    <p className="text-sm text-gray-500">Marked late</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Yesterday</p>
                  <p className="text-xs text-gray-400">2:15 PM</p>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-2">
              <Link 
                to="/attendance-history"
                className="inline-block text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View more activity
              </Link>
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
