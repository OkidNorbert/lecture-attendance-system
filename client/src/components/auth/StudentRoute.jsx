import { Navigate } from 'react-router-dom';

const StudentRoute = ({ children }) => {
  const userRole = localStorage.getItem('userRole');
  
  if (userRole !== 'student') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default StudentRoute; 