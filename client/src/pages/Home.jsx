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
import axios from 'axios';

const Home = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      if (res.data.role === 'admin') navigate('/admin');
      else if (res.data.role === 'lecturer') navigate('/lecturer');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
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
              label="Email"
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
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#1976d2',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#2c3e50',
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
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#1976d2',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#2c3e50',
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
              Sign In
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
