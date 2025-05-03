import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../utils/axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import QrCodeIcon from "@mui/icons-material/QrCode";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import TimerIcon from "@mui/icons-material/Timer";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";

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

const QRImage = styled('img')(({ theme }) => ({
  width: '100%',
  maxWidth: 250,
  height: 'auto',
  margin: '0 auto',
  display: 'block',
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  border: '8px solid white',
  backgroundColor: 'white',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)'
  }
}));

const GenerateQR = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    courseId: "",
    sessionId: "",
    duration: 5,
    latitude: "",
    longitude: "",
    radius: 50,
  });

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [expiryTime, setExpiryTime] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load courses for the lecturer
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/courses/lecturer");
        setCourses(response.data.courses || []);
        
        // Check if we have a selected course from navigation
        if (location.state?.selectedCourse) {
          setFormData(prev => ({
            ...prev,
            courseId: location.state.selectedCourse.id
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load your courses. Please try again.");
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [location.state]);

  // Automatically fetch location on load
  useEffect(() => {
    handleGetLocation();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle slider changes
  const handleSliderChange = (name) => (e, newValue) => {
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  // Manually fetch location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationAccess(false);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setLocationAccess(true);
          setError(null);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError(`Location access denied: ${err.message}. Please enable location services to generate a QR code.`);
          setLocationAccess(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser. Please use a device with GPS capabilities.");
    }
  };

  // Generate a unique session ID
  const generateSessionId = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}-${random}`;
  };

  // Generate QR Code
  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!formData.courseId) {
      setError("Please select a course");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError("GPS location is required to generate a QR Code");
      return;
    }

    // Create a unique session ID if not provided
    if (!formData.sessionId) {
      const newSessionId = generateSessionId();
      setFormData(prev => ({ ...prev, sessionId: newSessionId }));
    }

    setGenerating(true);
    setError(null);

    try {
      // Find the selected course details
      const selectedCourse = courses.find(course => course.id === formData.courseId);
      
      const payload = {
        ...formData,
        courseName: selectedCourse?.name || "",
        courseCode: selectedCourse?.code || ""
      };
      
      const res = await axios.post("/api/qrcode/generate", payload);

      if (!res.data.qrCodeUrl || !res.data.expiryTime) {
        throw new Error("QR Code generation failed");
      }

      setQrCodeUrl(res.data.qrCodeUrl);
      setExpiryTime(res.data.expiryTime);
    } catch (err) {
      console.error("QR Code Generation Error:", err);
      setError(err.response?.data?.message || "Error generating QR Code. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleBack = () => {
    navigate('/lecturer');
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
      className="generate-qr-page"
    >
      <StyledContainer maxWidth={false}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            width: '100%',
            maxWidth: '1200px',
            mx: 'auto'
          }}
        >
          <Box 
            display="flex" 
            alignItems="center" 
            mb={3}
            flexDirection={isMobile ? "column" : "row"}
            justifyContent={isMobile ? "center" : "space-between"}
          >
            <Box display="flex" alignItems="center" mb={isMobile ? 2 : 0}>
              <IconButton 
                onClick={handleBack}
                sx={{ mr: 1, color: '#6366F1' }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ fontWeight: 600, color: '#1f2937' }}
              >
                Generate Attendance QR Code
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleGetLocation}
              disabled={generating}
              sx={{
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(99, 102, 241, 0.15)'
              }}
            >
              Refresh Location
            </Button>
          </Box>
          
          {error && (
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
          )}
          
          {locationAccess && (
            <Alert 
              severity="success" 
              icon={<MyLocationIcon />}
              sx={{ 
                mb: 3, 
                borderRadius: '8px' 
              }}
            >
              Location access granted. Your coordinates have been captured successfully.
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={qrCodeUrl ? 6 : 12}>
              <form onSubmit={handleGenerate}>
                <Grid container spacing={2}>
                  {loading ? (
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Grid>
                  ) : (
                    <>
                      <Grid item xs={12}>
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="course-label">Course</InputLabel>
                          <Select
                            labelId="course-label"
                            id="courseId"
                            name="courseId"
                            value={formData.courseId}
                            onChange={handleChange}
                            label="Course"
                            required
                            disabled={generating}
                          >
                            {courses.length > 0 ? (
                              courses.map((course) => (
                                <MenuItem key={course.id} value={course.id}>
                                  {course.name} ({course.code})
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem disabled value="">
                                No courses available
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Session ID (Optional)"
                          name="sessionId"
                          value={formData.sessionId}
                          onChange={handleChange}
                          variant="outlined"
                          helperText="Leave blank to auto-generate"
                          disabled={generating}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography 
                          gutterBottom 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: '#4B5563', 
                            fontWeight: 500
                          }}
                        >
                          <TimerIcon sx={{ mr: 1, fontSize: '1.2rem', color: '#6366F1' }} />
                          QR Code Duration: {formData.duration} minutes
                        </Typography>
                        <Slider
                          name="duration"
                          value={formData.duration}
                          onChange={handleSliderChange('duration')}
                          step={1}
                          min={1}
                          max={30}
                          valueLabelDisplay="auto"
                          marks={[
                            { value: 1, label: '1m' },
                            { value: 15, label: '15m' },
                            { value: 30, label: '30m' }
                          ]}
                          disabled={generating}
                          sx={{
                            color: '#6366F1',
                            '& .MuiSlider-thumb': {
                              width: 24,
                              height: 24,
                              backgroundColor: '#fff',
                              border: '2px solid currentColor',
                              '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
                              },
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography 
                          gutterBottom 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: '#4B5563', 
                            fontWeight: 500
                          }}
                        >
                          <TravelExploreIcon sx={{ mr: 1, fontSize: '1.2rem', color: '#6366F1' }} />
                          Allowed Radius: {formData.radius} meters
                        </Typography>
                        <Slider
                          name="radius"
                          value={formData.radius}
                          onChange={handleSliderChange('radius')}
                          step={10}
                          min={10}
                          max={100}
                          valueLabelDisplay="auto"
                          marks={[
                            { value: 10, label: '10m' },
                            { value: 50, label: '50m' },
                            { value: 100, label: '100m' }
                          ]}
                          disabled={generating}
                          sx={{
                            color: '#6366F1',
                            '& .MuiSlider-thumb': {
                              width: 24,
                              height: 24,
                              backgroundColor: '#fff',
                              border: '2px solid currentColor',
                              '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
                              },
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#F3F4F6',
                            mb: 2
                          }}
                        >
                          <LocationOnIcon sx={{ fontSize: '1.5rem', color: '#6366F1', mr: 1 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#4B5563' }}>
                              Current Location
                            </Typography>
                            {formData.latitude && formData.longitude ? (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1F2937' }}>
                                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="error">
                                Location not available
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          fullWidth
                          size="large"
                          startIcon={<QrCodeIcon />}
                          disabled={generating || !formData.latitude || !formData.longitude || !formData.courseId}
                          sx={{
                            mt: 2,
                            p: 1.5,
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                              boxShadow: '0 6px 15px rgba(99, 102, 241, 0.35)',
                            }
                          }}
                        >
                          {generating ? (
                            <>
                              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                              Generating...
                            </>
                          ) : (
                            "Generate QR Code"
                          )}
                        </Button>
                      </Grid>
                    </>
                  )}
                </Grid>
              </form>
            </Grid>

            {qrCodeUrl && (
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: '#f7f8ff',
                    border: '1px solid #e0e7ff'
                  }}
                >
                  <Typography variant="h6" gutterBottom textAlign="center" sx={{ color: '#4338CA', fontWeight: 600 }}>
                    Attendance QR Code Ready
                  </Typography>
                  
                  <Box sx={{ position: 'relative', mb: 2, mt: 1 }}>
                    <QRImage src={qrCodeUrl} alt="Generated QR Code" />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: '#6366F1',
                        color: 'white',
                        borderRadius: 'full',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        zIndex: 10,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formData.duration} min validity
                    </Box>
                  </Box>

                  {expiryTime && (
                    <Chip
                      icon={<TimerIcon />}
                      label={`Expires at: ${new Date(expiryTime).toLocaleTimeString()}`}
                      color="error"
                      sx={{ mt: 1, mb: 2, fontWeight: 500 }}
                    />
                  )}

                  <Divider sx={{ width: '100%', my: 2 }} />
                  
                  <Typography variant="body2" sx={{ mb: 2, color: '#4B5563', textAlign: 'center' }}>
                    Ask students to scan this QR code with their devices to mark attendance.
                    Make sure they are within {formData.radius}m of your location.
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    component="a"
                    href={qrCodeUrl}
                    download="attendance-qr-code.png"
                    sx={{
                      mt: 1,
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    Download QR Code
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Paper>
      </StyledContainer>
    </Box>
  );
};

export default GenerateQR;
