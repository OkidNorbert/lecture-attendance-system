import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    
    // Redirect to home page
    navigate('/');
  };

  return (
    <Button
      variant="contained"
      color="error"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      sx={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
      }}
    >
      Logout
    </Button>
  );
};

export default LogoutButton; 