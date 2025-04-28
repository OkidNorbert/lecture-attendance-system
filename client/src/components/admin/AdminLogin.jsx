import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      // Store the token in localStorage
      localStorage.setItem('adminToken', data.token);
      
      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxWidth="sm" sx={{
      '@media (orientation: landscape) and (max-height: 600px)': {
        py: 2
      }
    }}>
      <Box sx={{ 
        mt: { xs: 4, sm: 8 },
        '@media (orientation: landscape) and (max-height: 600px)': {
          mt: 2
        }
      }}>
        <Paper elevation={3} sx={{ 
          p: { xs: 3, sm: 4 },
          '@media (orientation: landscape) and (max-height: 600px)': {
            display: 'flex',
            flexDirection: 'column',
            p: 3
          }
        }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom sx={{
            '@media (orientation: landscape) and (max-height: 600px)': {
              fontSize: '1.5rem'
            }
          }}>
            Admin Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '@media (orientation: landscape) and (max-height: 600px)': {
                  my: 1
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '@media (orientation: landscape) and (max-height: 600px)': {
                  my: 1
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 3,
                '@media (orientation: landscape) and (max-height: 600px)': {
                  mt: 2
                }
              }}
            >
              Login
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin; 