import { Navigate } from 'react-router-dom';

const LecturerRoute = ({ children }) => {
  const userRole = localStorage.getItem('userRole');
  
  if (userRole !== 'lecturer') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default LecturerRoute; 