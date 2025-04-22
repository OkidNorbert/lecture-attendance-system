import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LecturerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0
  });
  const [filters, setFilters] = useState({
    program: '',
    course: '',
    department: '',
    sessionDate: ''
  });
  const [sessions, setSessions] = useState([]);
  const [lecturerCourses, setLecturerCourses] = useState({
    courses: [],
    programs: [],
    departments: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch user data
      const userResponse = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUser(userResponse.data);
      
      if (userResponse.data.role !== "lecturer") {
        navigate("/dashboard");
        return;
      }
      
      // Fetch stats, courses, and sessions in parallel
      const [statsRes, coursesRes, sessionsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/attendance/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/courses/lecturer", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/attendance/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      // Format and set stats data
      const statsData = statsRes.data || {};
      setStats({
        totalSessions: statsData.totalSessions || 0,
        totalStudents: statsData.totalStudents || 0,
        averageAttendance: statsData.averageAttendance || 0
      });
      
      // Process courses data
      const coursesData = coursesRes.data || {};
      setLecturerCourses({
        courses: coursesData.courses || [],
        programs: coursesData.programs || [],
        departments: coursesData.departments || []
      });
      
      // Process sessions data
      setSessions(sessionsRes.data || []);
      
      console.log("Dashboard data loaded successfully");
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format) => {
    const token = localStorage.getItem("token");
    try {
      setIsLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/attendance/export?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setIsLoading(false);
    } catch (err) {
      setError("Failed to export records");
      setIsLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = async () => {
    const token = localStorage.getItem("token");
    try {
      setIsLoading(true);
      
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.program) params.append('program', filters.program);
      if (filters.course) params.append('course', filters.course);
      if (filters.department) params.append('department', filters.department);
      if (filters.sessionDate) params.append('sessionDate', filters.sessionDate);
      
      const response = await axios.get(`http://localhost:5000/api/attendance/sessions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSessions(response.data || []);
    } catch (err) {
      setError("Failed to filter sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header Section with Refresh Button */}
        <header className="mb-8 bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-indigo-800">Lecturer Dashboard</h1>
            <p className="text-indigo-600 mt-1">
              Welcome back, <span className="font-semibold">{user?.name}</span>
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate("/generate-qr")}
              className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center"
            >
              <span className="mr-2">📌</span>
              Generate QR
            </button>
            
            <button 
              onClick={refreshDashboard}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center"
            >
              <span className="mr-2">🔄</span>
              Refresh Data
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
        
        {/* Stats Overview Section with Enhanced Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-violet-400 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 font-medium">Total Sessions</p>
                <h3 className="text-4xl font-bold mt-1">{stats.totalSessions}</h3>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <span className="text-xl">🎓</span>
              </div>
            </div>
            <p className="mt-4 text-indigo-100">
              Sessions conducted this semester
            </p>
            <div className="mt-2 h-1 w-full bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full" 
                style={{ width: `${Math.min(100, stats.totalSessions * 5)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-fuchsia-400 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 font-medium">Total Students</p>
                <h3 className="text-4xl font-bold mt-1">{stats.totalStudents}</h3>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
            <p className="mt-4 text-purple-100">
              Students attending your courses
            </p>
            <div className="mt-2 h-1 w-full bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full" 
                style={{ width: `${Math.min(100, stats.totalStudents * 2)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-pink-400 to-rose-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-pink-100 font-medium">Average Attendance</p>
                <h3 className="text-4xl font-bold mt-1">{stats.averageAttendance}%</h3>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
            <p className="mt-4 text-pink-100">
              Attendance rate across all sessions
            </p>
            <div className="mt-2 h-1 w-full bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full" 
                style={{ width: `${stats.averageAttendance}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="bg-white rounded-t-2xl shadow-lg mb-0 overflow-hidden">
          <div className="flex overflow-x-auto">
            <button 
              onClick={() => setActiveTab(0)} 
              className={`py-4 px-8 font-medium flex items-center transition-all duration-300 ${
                activeTab === 0 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <span className="mr-2">🎓</span>
              Sessions
            </button>
            <button 
              onClick={() => setActiveTab(1)} 
              className={`py-4 px-8 font-medium flex items-center transition-all duration-300 ${
                activeTab === 1 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <span className="mr-2">📌</span>
              Generate QR
            </button>
            <button 
              onClick={() => setActiveTab(2)} 
              className={`py-4 px-8 font-medium flex items-center transition-all duration-300 ${
                activeTab === 2 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <span className="mr-2">📈</span>
              Attendance History
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6 mb-8">
          {/* Sessions Tab */}
          {activeTab === 0 && (
            <div>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Program</label>
                  <select 
                    value={filters.program}
                    onChange={(e) => handleFilterChange('program', e.target.value)}
                    className="w-full rounded-lg border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Programs</option>
                    {lecturerCourses.programs?.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Course</label>
                  <select 
                    value={filters.course}
                    onChange={(e) => handleFilterChange('course', e.target.value)}
                    className="w-full rounded-lg border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Courses</option>
                    {lecturerCourses.courses?.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <select 
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full rounded-lg border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Departments</option>
                    {lecturerCourses.departments?.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Session Date</label>
                  <input 
                    type="date"
                    value={filters.sessionDate}
                    onChange={(e) => handleFilterChange('sessionDate', e.target.value)}
                    className="w-full rounded-lg border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <button 
                  onClick={applyFilters}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center shadow-md"
                >
                  <span className="mr-2">🔍</span>
                  Apply Filters
                </button>
                
                <button 
                  onClick={() => handleExport('csv')}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition duration-200 flex items-center shadow-md"
                >
                  <span className="mr-2">📄</span>
                  Export CSV
                </button>
                
                <button 
                  onClick={() => handleExport('xlsx')}
                  className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition duration-200 flex items-center shadow-md"
                >
                  <span className="mr-2">📊</span>
                  Export Excel
                </button>
              </div>
              
              {/* Sessions Table */}
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <th className="py-3 px-4 text-left">Course</th>
                        <th className="py-3 px-4 text-left">Session ID</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Attendance</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sessions.length > 0 ? (
                        sessions.map((session, index) => (
                          <tr 
                            key={session._id || index} 
                            className="hover:bg-indigo-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-indigo-600 text-sm">📚</span>
                                </div>
                                <span className="font-medium text-gray-800">
                                  {session.courseId?.name || session.program || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-mono text-gray-800 inline-block">
                                {session.sessionId?.substring(0, 10)}...
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(session.createdAt).toLocaleDateString()}
                              <div className="text-xs text-gray-500">
                                {new Date(session.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-800">{session.presentCount || 0}</span>
                                <span className="mx-1 text-gray-400">/</span>
                                <span className="text-gray-600">{session.totalStudents || 0}</span>
                              </div>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-indigo-600 h-1.5 rounded-full" 
                                  style={{ 
                                    width: session.totalStudents ? 
                                      `${(session.presentCount / session.totalStudents) * 100}%` : '0%' 
                                  }}
                                ></div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                session.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : session.status === 'completed' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {session.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button 
                                onClick={() => {
                                  const sessionId = session._id || session.sessionId;
                                  if (sessionId) {
                                    console.log('Navigating to session details:', sessionId);
                                    navigate(`/session/${sessionId}`);
                                  } else {
                                    console.error('No valid session ID found:', session);
                                    setError('Cannot view session details: Missing session ID');
                                  }
                                }}
                                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 transition duration-200 text-sm"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-10 text-center text-gray-500">
                            {isLoading ? (
                              <div className="flex justify-center items-center">
                                <div className="w-6 h-6 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin mr-3"></div>
                                Loading sessions...
                              </div>
                            ) : (
                              "No sessions found matching your criteria"
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Generate QR Tab */}
          {activeTab === 1 && (
            <div className="text-center p-10">
              <div className="w-24 h-24 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">📌</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Create New Attendance Session</h3>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Generate a QR code for your lecture to track student attendance in real-time. 
                Students can scan this code to mark their attendance automatically.
              </p>
              <button 
                onClick={() => navigate("/generate-qr")}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105"
              >
                Generate QR Code
              </button>
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-indigo-50 p-5 rounded-xl text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🔒</span>
                  </div>
                  <h4 className="text-lg font-medium text-indigo-800 mb-2">Secure</h4>
                  <p className="text-sm text-gray-600">Each QR code is unique and expires after the session</p>
                </div>
                
                <div className="bg-purple-50 p-5 rounded-xl text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🔍</span>
                  </div>
                  <h4 className="text-lg font-medium text-purple-800 mb-2">Location-aware</h4>
                  <p className="text-sm text-gray-600">Verifies student location to prevent remote check-ins</p>
                </div>
                
                <div className="bg-pink-50 p-5 rounded-xl text-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">📱</span>
                  </div>
                  <h4 className="text-lg font-medium text-pink-800 mb-2">Mobile-friendly</h4>
                  <p className="text-sm text-gray-600">Students can easily scan with any smartphone</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Attendance History Tab */}
          {activeTab === 2 && (
            <div className="text-center p-10">
              <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">View Detailed Attendance Records</h3>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Access comprehensive attendance statistics, track student participation patterns, 
                and export reports for all your lecture sessions.
              </p>
              <button 
                onClick={() => navigate("/attendance-history")}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105"
              >
                View Attendance History
              </button>
              
              <div className="mt-10 flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
                <div className="flex-1 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-2">Attendance Reports</h4>
                  <p className="text-gray-600 mb-4">Generate detailed reports for each course and download them in various formats</p>
                  <div className="w-full bg-indigo-200 h-2 rounded-full">
                    <div className="bg-indigo-600 h-2 rounded-full w-3/4"></div>
                  </div>
                </div>
                
                <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <h4 className="text-lg font-semibold text-purple-800 mb-2">Visualization Tools</h4>
                  <p className="text-gray-600 mb-4">Visual charts and graphs to help you analyze attendance patterns over time</p>
                  <div className="w-full bg-purple-200 h-2 rounded-full">
                    <div className="bg-purple-600 h-2 rounded-full w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="mt-2 bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs hover:bg-red-200"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerDashboard;
