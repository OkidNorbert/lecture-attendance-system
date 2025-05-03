import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  ArrowBack as BackIcon,
  QrCode as QrCodeIcon,
  Home as HomeIcon,
  CheckCircle as PresentIcon,
  Warning as LateIcon,
  Cancel as AbsentIcon,
  Info as InfoIcon
} from "@mui/icons-material";

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  width: '100%',
  maxWidth: '100%',
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  }
}));

const DateHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(99, 102, 241, 0.08)',
  marginTop: theme.spacing(4),
}));

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAttendance = async () => {
      try {
        // Fetch User Role First
        const userRes = await axios.get("/api/auth/me");
        setUserRole(userRes.data.role);
        
        const apiUrl = userRes.data.role === "student"
          ? "/api/attendance/history"
          : "/api/attendance/lecturer";

        // Fetch Attendance Records
        const attendanceRes = await axios.get(apiUrl);

        // Process and enrich the records
        let enrichedRecords = [...attendanceRes.data];
        
        if (userRes.data.role === "lecturer") {
          // Additional processing for lecturer data if needed
        }
        
        // Format dates and sort by timestamp
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
        console.error("Error fetching attendance:", err);
        setError(err.response?.data?.message || "Error fetching attendance records.");
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

  // Helper function to get icon and color for each status
  const getStatusInfo = (status) => {
    switch(status?.toLowerCase()) {
      case 'present':
        return {
          icon: <PresentIcon />,
          color: 'success',
          light: '#ECFDF5',
          border: '#D1FAE5',
          text: '#059669'
        };
      case 'late':
        return {
          icon: <LateIcon />,
          color: 'warning',
          light: '#FFFBEB',
          border: '#FEF3C7',
          text: '#D97706'
        };
      case 'absent':
        return {
          icon: <AbsentIcon />,
          color: 'error',
          light: '#FEF2F2',
          border: '#FEE2E2',
          text: '#DC2626'
        };
      default:
        return {
          icon: <InfoIcon />,
          color: 'info',
          light: '#F3F4F6',
          border: '#E5E7EB',
          text: '#6B7280'
        };
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box 
      sx={{ 
        bgcolor: '#f9fafb', 
        minHeight: '100vh',
        width: '100vw',
        maxWidth: '100%',
        overflowX: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        position: 'absolute',
        top: 0,
        left: 0
      }}
      className="attendance-page"
    >
      <StyledContainer maxWidth={false}>
        <Box 
          display="flex" 
          alignItems="center" 
          mb={3}
        >
          <IconButton 
            onClick={handleBack}
            sx={{ mr: 1, color: '#6366F1' }}
          >
            <BackIcon />
          </IconButton>
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ fontWeight: 600, color: '#1f2937' }}
          >
            {userRole === "student" ? "My Attendance History" : "Attendance Dashboard"}
          </Typography>
        </Box>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={300}
            sx={{
              backgroundColor: '#F9FAFB',
              borderRadius: 3,
            }}
          >
            <CircularProgress color="primary" size={60} thickness={4} />
            <Typography variant="h6" sx={{ ml: 2, color: 'primary.main', fontWeight: 500 }}>
              Loading attendance records...
            </Typography>
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)'
            }}
          >
            {error}
          </Alert>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              backgroundColor: '#F9FAFB',
              border: '1px dashed #E5E7EB',
              boxShadow: 'none'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3
              }}
            >
              <CalendarIcon sx={{ fontSize: 40, color: '#6366F1' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1F2937' }}>
              No attendance records found
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, maxWidth: 500, mx: 'auto' }}>
              {userRole === "student" 
                ? "Scan QR codes in your lectures to build your attendance history."
                : "You don't have any recorded attendance sessions yet. Create a session by generating a QR code."}
            </Typography>
            {userRole === "student" ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<QrCodeIcon />}
                onClick={() => navigate("/scan-qr")}
                sx={{
                  borderRadius: '8px',
                  py: 1.5,
                  px: 3,
                  background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                    boxShadow: '0 6px 15px rgba(99, 102, 241, 0.35)',
                  }
                }}
              >
                Scan QR Code
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<QrCodeIcon />}
                onClick={() => navigate("/generate-qr")}
                sx={{
                  borderRadius: '8px',
                  py: 1.5,
                  px: 3,
                  background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                    boxShadow: '0 6px 15px rgba(99, 102, 241, 0.35)',
                  }
                }}
              >
                Generate QR Code
              </Button>
            )}
          </Paper>
        ) : (
          <Box>
            {Object.keys(groupedRecords).map(date => (
              <Box key={date} mb={4}>
                <DateHeader>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(99, 102, 241, 0.2)',
                      color: '#6366F1',
                      width: 40,
                      height: 40,
                      mr: 2
                    }}
                  >
                    <CalendarIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#4F46E5' }}>
                    {date}
                  </Typography>
                </DateHeader>
                
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead sx={{ bgcolor: '#F3F4F6' }}>
                        <TableRow>
                          {userRole === "lecturer" && (
                            <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Student</TableCell>
                          )}
                          <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Course</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Session ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Time</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Status</TableCell>
                          {userRole === "lecturer" && (
                            <TableCell sx={{ fontWeight: 'bold', color: '#4B5563' }}>Actions</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupedRecords[date].map((record, index) => {
                          const statusInfo = getStatusInfo(record.status);
                          return (
                            <TableRow 
                              key={index}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: statusInfo.light,
                                  transition: 'background-color 0.2s'
                                }
                              }}
                            >
                              {userRole === "lecturer" && (
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    <Avatar
                                      sx={{
                                        bgcolor: 'rgba(99, 102, 241, 0.2)',
                                        color: '#6366F1',
                                        width: 32,
                                        height: 32,
                                        mr: 1.5
                                      }}
                                    >
                                      <PersonIcon fontSize="small" />
                                    </Avatar>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {record.name || 'Unknown Student'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              )}
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar
                                    sx={{
                                      bgcolor: 'rgba(59, 130, 246, 0.2)',
                                      color: '#3B82F6',
                                      width: 32,
                                      height: 32,
                                      mr: 1.5
                                    }}
                                  >
                                    <SchoolIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body2">
                                    {record.course || record.sessionDetails?.courseCode || 'Unknown Course'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={record.sessionId || 'N/A'}
                                  size="small"
                                  sx={{
                                    borderRadius: '8px',
                                    bgcolor: '#F3F4F6',
                                    color: '#4B5563',
                                    fontFamily: 'monospace',
                                    maxWidth: 120,
                                    '& .MuiChip-label': {
                                      px: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <TimeIcon sx={{ color: '#8B5CF6', mr: 1, fontSize: '1rem' }} />
                                  <Typography variant="body2">
                                    {record.formattedTime}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={statusInfo.icon}
                                  label={record.status || 'Unknown'}
                                  size="small"
                                  color={statusInfo.color}
                                  sx={{
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                    bgcolor: statusInfo.light,
                                    color: statusInfo.text,
                                    border: `1px solid ${statusInfo.border}`
                                  }}
                                />
                              </TableCell>
                              {userRole === "lecturer" && (
                                <TableCell>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => navigate(`/session/${record.sessionId}`)}
                                    sx={{
                                      textTransform: 'none',
                                      borderRadius: '8px',
                                      background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                                      fontWeight: 500,
                                      px: 2
                                    }}
                                  >
                                    View Details
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            ))}
          </Box>
        )}

        <Box display="flex" justifyContent="center" mt={6} gap={2}>
          {userRole === "student" && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<QrCodeIcon />}
              onClick={() => navigate("/scan-qr")}
              sx={{
                borderRadius: '8px',
                py: 1.5,
                px: 3,
                fontWeight: 500,
                background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 6px 15px rgba(59, 130, 246, 0.35)',
                }
              }}
            >
              Scan QR Code
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{
              borderRadius: '8px',
              py: 1.5,
              px: 3,
              fontWeight: 500,
              background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
              '&:hover': {
                background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                boxShadow: '0 6px 15px rgba(16, 185, 129, 0.35)',
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </StyledContainer>
    </Box>
  );
};

export default AttendanceHistory;
