import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAttendance = async () => {
      try {
        // ✅ Fetch User Role First
        const userRes = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserRole(userRes.data.role);
        const apiUrl =
          userRes.data.role === "student"
            ? "http://localhost:5000/api/attendance/history"
            : "http://localhost:5000/api/attendance/lecturer";

        // ✅ Fetch Attendance Records
        const attendanceRes = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Fetch related course and session information to enrich the data
        let enrichedRecords = [...attendanceRes.data];
        
        // If we're a lecturer, fetch additional course information
        if (userRes.data.role === "lecturer") {
          // Get unique session IDs
          const sessionIds = [...new Set(enrichedRecords.map(record => record.sessionId))];
          
          // Fetch session details for each unique sessionId
          for (const sessionId of sessionIds) {
            try {
              const sessionRes = await axios.get(`http://localhost:5000/api/attendance/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              // Update all records with this sessionId to include session details
              enrichedRecords = enrichedRecords.map(record => {
                if (record.sessionId === sessionId) {
                  return {
                    ...record,
                    sessionDetails: {
                      courseCode: sessionRes.data.courseId?.name || 'Unknown',
                      startTime: sessionRes.data.createdAt,
                      expiryTime: sessionRes.data.expiryTime,
                      totalAttendees: sessionRes.data.attendees?.length || 0
                    }
                  };
                }
                return record;
              });
            } catch (err) {
              console.error(`Failed to fetch session details for ${sessionId}:`, err);
            }
          }
        }
        
        // Format timestamps and sort by date (newest first)
        enrichedRecords = enrichedRecords.map(record => {
          // Convert UTC date to local date
          const recordDate = new Date(record.date || record.createdAt || Date.now());
          
          // Format date with day name and month name
          const formattedDate = recordDate.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          
          // Format time with hours and minutes, 12-hour format with AM/PM
          const formattedTime = recordDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          return {
            ...record,
            formattedDate,
            formattedTime,
            timestamp: recordDate.getTime(),
            dateObject: recordDate
          };
        }).sort((a, b) => b.timestamp - a.timestamp);
        
        setRecords(enrichedRecords);
      } catch (err) {
        setError(err.response?.data?.msg || "❌ Error fetching attendance records.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [navigate]);

  // Group records by date
  const groupedRecords = records.reduce((groups, record) => {
    const date = record.formattedDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {});

  // Helper function to get background color for each status
  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'present':
        return {
          bgColor: 'bg-emerald-50',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-800',
          icon: '✓'
        };
      case 'late':
        return {
          bgColor: 'bg-amber-50',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-800',
          icon: '⏱'
        };
      case 'absent':
        return {
          bgColor: 'bg-rose-50',
          badgeBg: 'bg-rose-100',
          badgeText: 'text-rose-800',
          icon: '✗'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          badgeBg: 'bg-gray-100',
          badgeText: 'text-gray-800',
          icon: '?'
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg my-8">
      <h2 className="text-3xl font-bold mb-6 text-indigo-800 border-b pb-4">
        {userRole === "student" ? "📜 My Attendance History" : "📊 Lecturer Attendance Dashboard"}
      </h2>

      {/* ✅ Show loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-40 bg-indigo-50 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="ml-4 text-indigo-800 font-medium">Loading attendance records...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-100 p-6 rounded-lg text-rose-700 border border-rose-300">
          <p className="font-bold text-lg">Error:</p>
          <p>{error}</p>
        </div>
      ) : records.length > 0 ? (
        <div className="space-y-10">
          {Object.keys(groupedRecords).map(date => (
            <div key={date} className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-700">📅</span>
                </div>
                <h3 className="text-xl font-semibold text-indigo-900">{date}</h3>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
          <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        {userRole === "lecturer" && <th className="py-4 px-4 text-left">Student</th>}
                        <th className="py-4 px-4 text-left">Course</th>
                        <th className="py-4 px-4 text-left">Session ID</th>
                        <th className="py-4 px-4 text-left">Time</th>
                        <th className="py-4 px-4 text-left">Status</th>
                        {userRole === "lecturer" && <th className="py-4 px-4 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
                      {groupedRecords[date].map((record, index) => {
                        const statusStyle = getStatusStyle(record.status);
                        return (
                          <tr key={index} 
                              className={`${statusStyle.bgColor} border-b border-gray-200 hover:bg-opacity-80 transition-colors`}>
                            {userRole === "lecturer" && (
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-indigo-700 text-sm">👤</span>
                                  </div>
                                  <span className="font-medium">{record.name || 'Unknown'}</span>
                                </div>
                              </td>
                            )}
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-blue-700 text-sm">📚</span>
                                </div>
                                <span>{record.course || record.sessionDetails?.courseCode || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-mono text-gray-800 flex items-center">
                                <span className="mr-1">🔢</span>
                                <span className="truncate max-w-[120px]">{record.sessionId}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-purple-700 text-sm">🕒</span>
                                </div>
                                <span>{record.formattedTime}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyle.badgeBg} ${statusStyle.badgeText}`}>
                                <span className="mr-1">{statusStyle.icon}</span>
                                {record.status || 'Unknown'}
                              </span>
                            </td>
                            {userRole === "lecturer" && (
                              <td className="py-3 px-4 text-center">
                                <button 
                                  onClick={() => navigate(`/session/${record.sessionId}`)}
                                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm py-2 px-4 rounded-full shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                                >
                                  View Details
                                </button>
                              </td>
                            )}
              </tr>
                        );
                      })}
          </tbody>
        </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📭</span>
          </div>
          <h3 className="text-xl font-semibold text-indigo-900 mb-2">No attendance records found</h3>
          {userRole === "student" && (
            <p className="text-indigo-700">Scan QR codes in your lectures to build your attendance history.</p>
          )}
        </div>
      )}

      {/* ✅ Navigation Buttons */}
      <div className="flex justify-center space-x-6 mt-8">
        {userRole === "student" && (
          <button
            onClick={() => navigate("/scan-qr")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-full font-medium flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <span className="mr-2 text-xl">📸</span> Scan QR Code
          </button>
        )}
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-full font-medium flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span className="mr-2 text-xl">🏠</span> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AttendanceHistory;
