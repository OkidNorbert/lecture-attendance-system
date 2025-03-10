import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  School,
  Person,
  Lock
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const Home = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData); // Log login attempt

      const response = await axios.post('/api/auth/login', formData);
      console.log('Server response:', response.data); // Log server response

      if (!response.data || !response.data.token) {
        throw new Error('Invalid response structure');
      }

      // Store auth data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Navigate based on role
      switch (response.data.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'lecturer':
          navigate('/lecturer');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          throw new Error(`Invalid role: ${response.data.role}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different types of errors
      if (err.response) {
        // Server responded with error
        setError(err.response.data.msg || 'Server error occurred');
      } else if (err.request) {
        // Request made but no response
        setError('No response from server. Please try again.');
      } else {
        // Other errors
        setError(err.message || 'An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #512da8 100%)',
        margin: 0,
        padding: 0,
      }}
    >
      <Container maxWidth="sm" sx={{ m: 0 }}>
        <Paper
          elevation={5}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            width: '100%',
            maxWidth: '400px',
            mx: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <School 
            sx={{ 
              fontSize: 50, 
              color: '#1976d2',
              mb: 2 
            }} 
          />
          
          <Typography
            component="h1"
            variant="h4"
            sx={{
              mb: 4,
              fontWeight: 600,
              color: '#1976d2',
              textAlign: 'center',
            }}
          >
            Attendance Management System
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            <TextField
              required
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#1976d2' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1976d2',
                },
              }}
            />

            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#1976d2' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1976d2',
                },
              }}
            />

            {error && (
              <Typography color="error" textAlign="center">
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 2 }}
          >
            © {new Date().getFullYear()} Attendance Management System
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home;
